import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { IamApi } from '../infrastructure/iam-api.js';
import { UserAssembler } from '../infrastructure/user.assembler.js';
import { User } from '../domain/model/user.entity.js';
import { UserRole } from '../domain/model/user-role.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';
import { toBusinessRuleError } from '../../shared/infrastructure/api-error.js';
import { loadSession, saveSession } from '../../shared/infrastructure/session-storage.js';

/** Temporary password of invited members (the API uses the same one by default). */
export const INVITATION_TEMPORARY_PASSWORD = 'stockia123';

/** API error codes (problem title) → i18n keys of this context. */
const IAM_ERRORS = {
  InvalidCredentials: 'iam.errors.invalid-credentials',
  EmailAlreadyTaken: 'iam.errors.email-taken',
  CurrentPasswordInvalid: 'iam.errors.wrong-current-password',
  SamePassword: 'iam.errors.same-password',
  LastAdministrator: 'iam.errors.last-admin',
  CannotRemoveYourself: 'iam.errors.remove-self',
  Forbidden: 'iam.errors.admin-only',
};

const iamApi = new IamApi();

/**
 * Application layer of the User & Access Management Bounded Context:
 * session (sign-in, sign-up, sign-out), account settings (profile,
 * restaurant data, password change with verification) and team management.
 *
 * @remarks
 * The StockIA Platform API checks every rule again (unique email, current
 * password, at least one Administrator, admin-only endpoints); this store
 * maps its error codes to the i18n messages of the Web Application.
 */
export const useIamStore = defineStore('iam', () => {
  const stored = loadSession();
  /** @type {import('vue').Ref<User|null>} */
  const currentUser = ref(stored ? new User(stored.user) : null);
  /** @type {import('vue').Ref<User[]>} */
  const users = ref([]);

  const isAuthenticated = computed(() => currentUser.value !== null);
  const isAdmin = computed(() => currentUser.value?.role === UserRole.ADMIN);
  const adminCount = computed(() => users.value.filter((user) => user.isAdmin).length);

  /**
   * @param {User|null} user
   * @param {string} [token] new JWT; keeps the current one when omitted
   */
  function setSession(user, token) {
    currentUser.value = user;
    saveSession(user ? { user: { ...user }, token: token ?? loadSession()?.token } : null);
  }

  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<User>}
   */
  async function signIn(email, password) {
    try {
      const { data } = await iamApi.signIn({ email: email.trim().toLowerCase(), password });
      const user = UserAssembler.toEntityFromResource(data);
      setSession(user, data.token);
      return user;
    } catch (error) {
      throw toBusinessRuleError(error, IAM_ERRORS);
    }
  }

  /**
   * Registers the restaurant and its owner as the first Administrator (the
   * API also gives it the free plan) and signs in.
   *
   * @param {{fullName: string, restaurantName: string, email: string, password: string}} form
   * @returns {Promise<User>}
   */
  async function signUp({ fullName, restaurantName, email, password }) {
    try {
      const { data } = await iamApi.signUp({
        fullName: fullName.trim(), restaurantName: restaurantName.trim(), email: email.trim().toLowerCase(), password,
      });
      const user = UserAssembler.toEntityFromResource(data);
      setSession(user, data.token);
      return user;
    } catch (error) {
      throw toBusinessRuleError(error, IAM_ERRORS);
    }
  }

  function signOut() {
    setSession(null);
    users.value = [];
  }

  /**
   * Edits the name and email of the signed-in user.
   *
   * @param {{fullName: string, email: string}} changes
   * @returns {Promise<User>}
   */
  async function updateProfile({ fullName, email }) {
    if (!currentUser.value) throw new BusinessRuleError('iam.errors.no-session');
    try {
      const { data } = await iamApi.updateProfile(currentUser.value.id, { fullName: fullName.trim(), email: email.trim().toLowerCase() });
      const updated = UserAssembler.toEntityFromResource(data);
      setSession(updated);
      return updated;
    } catch (error) {
      throw toBusinessRuleError(error, IAM_ERRORS);
    }
  }

  /**
   * Edits the restaurant data (Administrator only).
   *
   * @param {{restaurantName: string, restaurantAddress: string, restaurantPhone: string}} changes
   * @returns {Promise<User>}
   */
  async function updateRestaurant({ restaurantName, restaurantAddress, restaurantPhone }) {
    if (!isAdmin.value) throw new BusinessRuleError('iam.errors.admin-only');
    try {
      const { data } = await iamApi.updateRestaurant({
        name: restaurantName.trim(), address: (restaurantAddress ?? '').trim(), phone: (restaurantPhone ?? '').trim(),
      });
      const updated = new User({ ...currentUser.value, restaurantName: data.name, restaurantAddress: data.address, restaurantPhone: data.phone });
      setSession(updated);
      return updated;
    } catch (error) {
      throw toBusinessRuleError(error, IAM_ERRORS);
    }
  }

  /**
   * Changes the password; the API verifies the current one first.
   *
   * @param {{currentPassword: string, newPassword: string}} form
   */
  async function changePassword({ currentPassword, newPassword }) {
    if (!currentUser.value) throw new BusinessRuleError('iam.errors.no-session');
    if (currentPassword === newPassword) throw new BusinessRuleError('iam.errors.same-password');
    try {
      await iamApi.changePassword(currentUser.value.id, { currentPassword, newPassword });
    } catch (error) {
      throw toBusinessRuleError(error, IAM_ERRORS);
    }
  }

  /** Team of the restaurant, newest first (Administrator). */
  async function loadUsers() {
    const response = await iamApi.getUsers();
    users.value = UserAssembler.toEntitiesFromResponse(response).sort((a, b) => Number(b.id) - Number(a.id));
  }

  /**
   * Invites a new member; the API gives it the temporary password.
   *
   * @param {{fullName: string, email: string, role: string}} form
   */
  async function inviteMember({ fullName, email, role }) {
    try {
      await iamApi.inviteMember({ fullName: fullName.trim(), email: email.trim().toLowerCase(), role });
    } catch (error) {
      throw toBusinessRuleError(error, IAM_ERRORS);
    }
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
   * @param {User} user
   * @param {string} role
   */
  async function changeRole(user, role) {
    if (role === user.role) return;
    if (!canChangeRole(user)) throw new BusinessRuleError('iam.errors.last-admin');
    try {
      await iamApi.changeRole(user.id, role);
    } catch (error) {
      throw toBusinessRuleError(error, IAM_ERRORS);
    }
    if (user.id === currentUser.value?.id) setSession(new User({ ...currentUser.value, role }));
    await loadUsers();
  }

  /** @param {User} user */
  async function removeMember(user) {
    if (user.id === currentUser.value?.id) throw new BusinessRuleError('iam.errors.remove-self');
    if (user.isAdmin && adminCount.value <= 1) throw new BusinessRuleError('iam.errors.last-admin');
    try {
      await iamApi.removeMember(user.id);
    } catch (error) {
      throw toBusinessRuleError(error, IAM_ERRORS);
    }
    await loadUsers();
  }

  return {
    currentUser, users, isAuthenticated, isAdmin, adminCount,
    signIn, signUp, signOut, updateProfile, updateRestaurant, changePassword, loadUsers, inviteMember, canChangeRole, changeRole, removeMember,
  };
});
