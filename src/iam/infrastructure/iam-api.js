import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the User & Access Management Bounded Context.
 *
 * @remarks
 * With the json-server mock API, signing in is a query by email and password
 * over `/users`; the ASP.NET Core RESTful API will replace it with a
 * `POST /authentication/sign-in` endpoint that returns a token.
 */
export class IamApi extends BaseApi {
  #usersEndpoint;

  constructor() {
    super();
    this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
  }

  /** @returns {Promise<import('axios').AxiosResponse<any[]>>} */
  getUsers() {
    return this.#usersEndpoint.getAll();
  }

  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<import('axios').AxiosResponse<any[]>>} matching users; empty when credentials are wrong
   */
  signIn(email, password) {
    return this.#usersEndpoint.getAll({ email, password });
  }

  /**
   * @param {number} id
   * @returns {Promise<import('axios').AxiosResponse<any>>}
   */
  getUserById(id) {
    return this.#usersEndpoint.getById(id);
  }

  /** @param {Object} resource */
  createUser(resource) {
    return this.#usersEndpoint.create(resource);
  }

  /**
   * @param {number} id
   * @param {Object} resource complete user resource
   */
  updateUser(id, resource) {
    return this.#usersEndpoint.update(id, resource);
  }

  /** @param {number} id */
  deleteUser(id) {
    return this.#usersEndpoint.delete(id);
  }
}
