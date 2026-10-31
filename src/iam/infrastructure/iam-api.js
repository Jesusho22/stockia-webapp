import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const authenticationEndpointPath = import.meta.env.VITE_AUTHENTICATION_ENDPOINT_PATH ?? '/authentication';
const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Identity & Access Management Bounded Context
 * over the StockIA Platform API: sign-in returns the user with a JWT (Login
 * Controller), the password recovery goes by email (Password Reset Service)
 * and the team is managed by the Administrator. The password never travels
 * back from the API.
 */
export class IamApi extends BaseApi {
  #authenticationEndpoint;
  #usersEndpoint;

  constructor() {
    super();
    this.#authenticationEndpoint = new BaseEndpoint(this, authenticationEndpointPath);
    this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
  }

  /** @param {{email: string, password: string}} credentials */
  signIn(credentials) { return this.#authenticationEndpoint.post('sign-in', credentials); }

  /** "Forgot your password?": the API emails a recovery link. @param {string} email */
  requestPasswordReset(email) { return this.#authenticationEndpoint.post('password-reset-requests', { email }); }

  /** @param {{email: string, code: string, newPassword: string}} reset */
  resetPassword(reset) { return this.#authenticationEndpoint.post('password-resets', reset); }

  /** Team of the restaurant (Administrator). */
  getUsers() { return this.#usersEndpoint.getAll(); }

  /** @param {{fullName: string, email: string, role: string}} member */
  inviteMember(member) { return this.#usersEndpoint.create(member); }

  /** @param {number} id @param {{fullName: string, email: string}} profile */
  updateProfile(id, profile) { return this.#usersEndpoint.patch(`${id}`, profile); }

  /** @param {number} id @param {{currentPassword: string, newPassword: string}} passwords */
  changePassword(id, passwords) { return this.#usersEndpoint.post(`${id}/change-password`, passwords); }

  /** @param {number} id @param {string} role */
  changeRole(id, role) { return this.#usersEndpoint.patch(`${id}/role`, { role }); }

  /** Unlocks a member locked by wrong passwords (Administrator). @param {number} id */
  unlockMember(id) { return this.#usersEndpoint.post(`${id}/unlock`); }

  /** @param {number} id */
  removeMember(id) { return this.#usersEndpoint.delete(id); }
}
