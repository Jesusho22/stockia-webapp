import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { IamApi } from '../infrastructure/iam-api.js';
import { UserAssembler } from '../infrastructure/user.assembler.js';
import { User } from '../domain/model/user.entity.js';
import { UserRole } from '../domain/model/user-role.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';
import { problemOf, toBusinessRuleError } from '../../shared/infrastructure/api-error.js';
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
  InvalidResetCode: 'iam.errors.invalid-reset-code',
};

/** From this number of remaining tries the sign-in warns how many are left. */
const WARN_ATTEMPTS_LEFT = 2;

const iamApi = new IamApi();

/**
 * Application layer of the Identity & Access Management Bounded Context:
 * session (sign-in, sign-out), password (change with verification and
 * recovery by email), account lock after wrong passwords and team
 * management. The restaurant registration (sign-up) and the restaurant data
 * belong to Restaurant Registration, which opens the session through
 * `startSession`.
 *
 * @remarks
 * The StockIA Platform API checks every rule again (unique email, current
 * password, at least one Administrator, admin-only endpoints, 5 wrong
 * passwords lock the account for 15 minutes); this store maps its error
 * codes to the i18n messages of the Web Application.
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
   * Opens the session with a user resource that carries its JWT (sign-in or
   * restaurant registration).
   *
   * @param {Object} resource authenticated user returned by the API
   * @returns {User}
   */
  function startSession(resource) {
    const user = UserAssembler.toEntityFromResource(resource);
    setSession(user, resource.token);
    return user;
  }

  /**
   * Login Controller + Account Lock Service: after 5 wrong passwords in a row
   * the API locks the account for 15 minutes.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<User>}
   */
  async function signIn(email, password) {
    try {
      const { data } = await iamApi.signIn({ email: email.trim().toLowerCase(), password });
      return startSession(data);
    } catch (error) {
      const problem = problemOf(error);
      if (problem?.title === 'AccountLocked') {
        throw new BusinessRuleError('iam.errors.account-locked', { minutes: problem.details?.minutesLeft ?? 15 });
      }
      const remaining = problem?.details?.remainingAttempts;
      if (problem?.title === 'InvalidCredentials' && Number.isInteger(remaining) && remaining <= WARN_ATTEMPTS_LEFT) {
        throw new BusinessRuleError('iam.errors.invalid-credentials-attempts', { count: remaining });
      }
      throw toBusinessRuleError(error, IAM_ERRORS);
    }
  }

  function signOut() {
    setSession(null);
    users.value = [];
  }

  /**
   * Keeps the restaurant data shown with the user in sync after Restaurant
   * Registration saves it.
   *
   * @param {{name: string, address: string, phone: string}} restaurant
   */
  function applyRestaurant({ name, address, phone }) {
    if (!currentUser.value) return;
    setSession(new User({ ...currentUser.value, restaurantName: name, restaurantAddress: address, restaurantPhone: phone }));
  }

  /**
   * "Forgot your password?" (Password Reset Service): the API emails a
   * recovery link. The answer is the same whether the email is registered or not.
   *
   * @param {string} email
   * @returns {Promise<{sentTo: string, simulatedEmail: {resetLink: string, code: string, expiresAt: string}|null}>}
   */
  async function requestPasswordReset(email) {
    const { data } = await iamApi.requestPasswordReset(email.trim().toLowerCase());
    return { sentTo: data.sentTo, simulatedEmail: data.simulatedEmail ?? null };
  }

  /**
   * Sets a new password with the code of the recovery link; it also unlocks the account.
   *
   * @param {{email: string, code: string, newPassword: string}} reset
   */
  async function resetPassword({ email, code, newPassword }) {
    try {
      await iamApi.resetPassword({ email: email.trim().toLowerCase(), code: String(code).trim(), newPassword });
    } catch (error) {
      throw toBusinessRuleError(error, IAM_ERRORS);
    }
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
   * Password Change Service: the API verifies the current password first.
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

  /**
   * Unlocks a member locked by wrong passwords (Account Lock Service).
   *
   * @param {User} user
   */
  async function unlockMember(user) {
    await iamApi.unlockMember(user.id);
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
    signIn, startSession, signOut, applyRestaurant, requestPasswordReset, resetPassword, updateProfile, changePassword,
    loadUsers, inviteMember, canChangeRole, changeRole, unlockMember, removeMember,
  };
});
