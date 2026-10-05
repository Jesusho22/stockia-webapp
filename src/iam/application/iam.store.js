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
 * session (sign-in, sign-up, sign-out, profile) and team management
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
   * Registers the restaurant owner as the first Administrator.
   *
   * @param {{fullName: string, restaurantName: string, email: string, password: string}} form
   * @returns {Promise<User>}
   */
  async function signUp({ fullName, restaurantName, email, password }) {
    const user = new User({ fullName: fullName.trim(), restaurantName: restaurantName.trim(), email: email.trim().toLowerCase(), role: UserRole.ADMIN });
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
   * Edits the profile of the signed-in user. The stored password is kept
   * unless a new one is given, because PUT replaces the whole record.
   *
   * @param {{fullName: string, restaurantName: string, email: string, password?: string}} changes
   * @returns {Promise<User>}
   */
  async function updateProfile({ fullName, restaurantName, email, password }) {
    if (!currentUser.value) throw new BusinessRuleError('iam.errors.no-session');
    const { data: stored } = await iamApi.getUserById(currentUser.value.id);
    const resource = {
      ...stored,
      fullName: fullName.trim(),
      restaurantName: restaurantName.trim(),
      email: email.trim().toLowerCase(),
      ...(password ? { password } : {}),
    };
    await iamApi.updateUser(currentUser.value.id, resource);
    const updated = UserAssembler.toEntityFromResource(resource);
    setSession(updated);
    return updated;
  }

  async function loadUsers() {
    const response = await iamApi.getUsers();
    users.value = UserAssembler.toEntitiesFromResponse(response);
  }

  /**
   * Invites a new member to the team with a temporary password.
   *
   * @param {{fullName: string, email: string, role: string}} form
   */
  async function inviteMember({ fullName, email, role }) {
    const member = new User({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      restaurantName: currentUser.value?.restaurantName ?? '',
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
    signIn, signUp, signOut, updateProfile, loadUsers, inviteMember, canChangeRole, changeRole, removeMember,
  };
});
