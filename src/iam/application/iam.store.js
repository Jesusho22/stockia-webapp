import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { IamApi } from '../infrastructure/iam-api.js';
import { UserAssembler } from '../infrastructure/user.assembler.js';
import { User } from '../domain/model/user.entity.js';
import { UserRole } from '../domain/model/user-role.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';

const SESSION_STORAGE_KEY = 'stockia.session';
/** Temporary password of invited members (a real API would send an invitation email). */
export const INVITATION_TEMPORARY_PASSWORD = 'stockia123';

const iamApi = new IamApi();

/**
 * @returns {User|null} session restored from this browser, if any
 */
function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? new User(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** @param {User|null} user */
function persistSession(user) {
  try {
    if (user) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* storage blocked: the session lasts until the tab is closed */
  }
}

/**
 * Application layer of the User & Access Management Bounded Context:
 * session (sign-in, sign-up, sign-out), account settings (profile,
 * restaurant data, password change with verification) and team management
 * (invite members, assign roles, remove members).
 */
export const useIamStore = defineStore('iam', () => {
  /** @type {import('vue').Ref<User|null>} */
  const currentUser = ref(restoreSession());
  /** @type {import('vue').Ref<User[]>} */
  const users = ref([]);

  const isAuthenticated = computed(() => currentUser.value !== null);
  const isAdmin = computed(() => currentUser.value?.role === UserRole.ADMIN);
  const adminCount = computed(() => users.value.filter((user) => user.isAdmin).length);

  /** @param {User} user */
  function setSession(user) {
    currentUser.value = user;
    persistSession(user);
  }

  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<User>}
   */
  async function signIn(email, password) {
    const response = await iamApi.signIn(email.trim().toLowerCase(), password);
    const matches = UserAssembler.toEntitiesFromResponse(response);
    if (matches.length === 0) throw new BusinessRuleError('iam.errors.invalid-credentials');
    setSession(matches[0]);
    return matches[0];
  }

  /**
   * Registers the restaurant owner as the first Administrator. An email can
   * only belong to one account.
   *
   * @param {{fullName: string, restaurantName: string, email: string, password: string}} form
   * @returns {Promise<User>}
   */
  async function signUp({ fullName, restaurantName, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await iamApi.findByEmail(normalizedEmail);
    if ((existing.data ?? []).length > 0) throw new BusinessRuleError('iam.errors.email-taken');
    const user = new User({ fullName: fullName.trim(), restaurantName: restaurantName.trim(), email: normalizedEmail, role: UserRole.ADMIN });
    const resource = UserAssembler.toResourceFromEntity(user, password);
    delete resource.id;
    const response = await iamApi.createUser(resource);
    const created = UserAssembler.toEntityFromResource(response.data);
    setSession(created);
    return created;
  }

  function signOut() {
    setSession(null);
    users.value = [];
  }

  /**
   * Reads the stored record of the signed-in user. PUT replaces the whole
   * record, so every change is merged over it (the password is kept).
   *
   * @returns {Promise<Object>}
   */
  async function getStoredSessionUser() {
    if (!currentUser.value) throw new BusinessRuleError('iam.errors.no-session');
    const { data } = await iamApi.getUserById(currentUser.value.id);
    return data;
  }

  /**
   * Edits the personal data of the signed-in user. The email must stay unique.
   *
   * @param {{fullName: string, email: string}} changes
   * @returns {Promise<User>}
   */
  async function updateProfile({ fullName, email }) {
    const stored = await getStoredSessionUser();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== stored.email) {
      const existing = await iamApi.findByEmail(normalizedEmail);
      if ((existing.data ?? []).some((candidate) => candidate.id !== stored.id)) throw new BusinessRuleError('iam.errors.email-taken');
    }
    const resource = { ...stored, fullName: fullName.trim(), email: normalizedEmail };
    await iamApi.updateUser(stored.id, resource);
    const updated = UserAssembler.toEntityFromResource(resource);
    setSession(updated);
    return updated;
  }

  /**
   * Edits the restaurant data (Administrator only). Every member of the team
   * keeps the same restaurant data.
   *
   * @param {{restaurantName: string, restaurantAddress: string, restaurantPhone: string}} changes
   * @returns {Promise<User>}
   */
  async function updateRestaurant({ restaurantName, restaurantAddress, restaurantPhone }) {
    if (!isAdmin.value) throw new BusinessRuleError('iam.errors.admin-only');
    const stored = await getStoredSessionUser();
    const restaurant = {
      restaurantName: restaurantName.trim(),
      restaurantAddress: (restaurantAddress ?? '').trim(),
      restaurantPhone: (restaurantPhone ?? '').trim(),
    };
    const { data: everyone } = await iamApi.getUsers();
    const team = (everyone ?? []).filter((member) => member.id === stored.id || member.restaurantName === stored.restaurantName);
    await Promise.all(team.map((member) => iamApi.updateUser(member.id, { ...member, ...restaurant })));
    const updated = UserAssembler.toEntityFromResource({ ...stored, ...restaurant });
    setSession(updated);
    return updated;
  }

  /**
   * Changes the password after verifying the current one.
   *
   * @param {{currentPassword: string, newPassword: string}} form
   */
  async function changePassword({ currentPassword, newPassword }) {
    const stored = await getStoredSessionUser();
    if (stored.password !== currentPassword) throw new BusinessRuleError('iam.errors.wrong-current-password');
    if (currentPassword === newPassword) throw new BusinessRuleError('iam.errors.same-password');
    await iamApi.updateUser(stored.id, { ...stored, password: newPassword });
  }

  async function loadUsers() {
    const response = await iamApi.getUsers();
    // Newest members first (the API assigns increasing ids).
    users.value = UserAssembler.toEntitiesFromResponse(response).sort((a, b) => Number(b.id) - Number(a.id));
  }

  /**
   * Invites a new member to the team with a temporary password.
   *
   * @param {{fullName: string, email: string, role: string}} form
   */
  async function inviteMember({ fullName, email, role }) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await iamApi.findByEmail(normalizedEmail);
    if ((existing.data ?? []).length > 0) throw new BusinessRuleError('iam.errors.email-taken');
    const member = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      role,
      restaurantName: currentUser.value?.restaurantName ?? '',
      restaurantAddress: currentUser.value?.restaurantAddress ?? '',
      restaurantPhone: currentUser.value?.restaurantPhone ?? '',
    });
    const resource = UserAssembler.toResourceFromEntity(member, INVITATION_TEMPORARY_PASSWORD);
    delete resource.id;
    await iamApi.createUser(resource);
    await loadUsers();
  }

  /**
   * The team must always keep at least one Administrator.
   *
   * @param {User} user
   * @returns {boolean}
   */
  function canChangeRole(user) {
    return !(user.isAdmin && adminCount.value <= 1);
  }

  /**
   * Assigns a role to a team member.
   *
   * @param {User} user
   * @param {string} role
   */
  async function changeRole(user, role) {
    if (role === user.role) return;
    if (!canChangeRole(user)) throw new BusinessRuleError('iam.errors.last-admin');
    const { data: stored } = await iamApi.getUserById(user.id);
    await iamApi.updateUser(user.id, { ...stored, role });
    if (user.id === currentUser.value?.id) setSession(new User({ ...currentUser.value, role }));
    await loadUsers();
  }

  /**
   * Removes a member from the team.
   *
   * @param {User} user
   */
  async function removeMember(user) {
    if (user.id === currentUser.value?.id) throw new BusinessRuleError('iam.errors.remove-self');
    if (user.isAdmin && adminCount.value <= 1) throw new BusinessRuleError('iam.errors.last-admin');
    await iamApi.deleteUser(user.id);
    await loadUsers();
  }

  return {
    currentUser, users, isAuthenticated, isAdmin, adminCount,
    signIn, signUp, signOut, updateProfile, updateRestaurant, changePassword, loadUsers, inviteMember, canChangeRole, changeRole, removeMember,
  };
});
