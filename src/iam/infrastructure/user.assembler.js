import { User } from '../domain/model/user.entity.js';

/**
 * @typedef {Object} UserResource
 * @property {number} id
 * @property {string} fullName
 * @property {string} email
 * @property {string} role ADMIN | EMPLOYEE
 * @property {number} restaurantId
 * @property {string} restaurantName
 * @property {string} [restaurantAddress]
 * @property {string} [restaurantPhone]
 * @property {boolean} [locked]
 * @property {string|null} [lockedUntil]
 * @property {string} [token] only in sign-in and restaurant registration responses
 */

/**
 * Maps user resources of the API into domain entities.
 */
export class UserAssembler {
  /**
   * @param {UserResource} resource
   * @returns {User}
   */
  static toEntityFromResource(resource) {
    // The token stays in the session storage: it never reaches the entity.
    const { token, ...data } = resource ?? {};
    return new User(data);
  }

  /**
   * @param {import('axios').AxiosResponse<UserResource[]>} response
   * @returns {User[]}
   */
  static toEntitiesFromResponse(response) {
    return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
