import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const authenticationEndpointPath = import.meta.env.VITE_AUTHENTICATION_ENDPOINT_PATH ?? '/authentication';
const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;
const restaurantsEndpointPath = import.meta.env.VITE_RESTAURANTS_ENDPOINT_PATH ?? '/restaurants';

/**
 * Infrastructure adapter of the User & Access Management Bounded Context over
 * the StockIA Platform API: sign-in/sign-up return the user with a JWT; the
 * password never travels back from the API.
 */
export class IamApi extends BaseApi {
  #authenticationEndpoint;
  #usersEndpoint;
  #restaurantsEndpoint;

  constructor() {
    super();
    this.#authenticationEndpoint = new BaseEndpoint(this, authenticationEndpointPath);
    this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
    this.#restaurantsEndpoint = new BaseEndpoint(this, restaurantsEndpointPath);
  }

  /** @param {{email: string, password: string}} credentials */
  signIn(credentials) { return this.#authenticationEndpoint.post('sign-in', credentials); }

  /** @param {{fullName: string, restaurantName: string, email: string, password: string}} form */
  signUp(form) { return this.#authenticationEndpoint.post('sign-up', form); }

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

  /** @param {number} id */
  removeMember(id) { return this.#usersEndpoint.delete(id); }

  getRestaurant() { return this.#restaurantsEndpoint.getPath('current'); }

  /** @param {{name: string, address: string, phone: string}} restaurant */
  updateRestaurant(restaurant) { return this.#restaurantsEndpoint.put('current', restaurant); }
}
