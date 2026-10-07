import { User } from '../domain/model/user.entity.js';

/**
 * @typedef {Object} UserResource
 * @property {number} id
 * @property {string} fullName
 * @property {string} email
 * @property {string} restaurantName
 * @property {string} [restaurantAddress]
 * @property {string} [restaurantPhone]
 * @property {string} role
 * @property {string} [password]
 */

/**
 * Maps user resources of the API into domain entities and back.
 */
export class UserAssembler {
  /**
   * @param {UserResource} resource
   * @returns {User}
   */
  static toEntityFromResource(resource) {
    // The password stays in the infrastructure layer: it never reaches the entity.
    const { password, ...data } = resource ?? {};
    return new User(data);
  }

  /**
   * @param {import('axios').AxiosResponse<UserResource[]>} response
   * @returns {User[]}
   */
  static toEntitiesFromResponse(response) {
    return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @param {User} entity
   * @param {string} [password] only sent when it is set or changed
   * @returns {UserResource}
   */
  static toResourceFromEntity(entity, password) {
    const resource = {
      id: entity.id,
      fullName: entity.fullName,
      email: entity.email,
      restaurantName: entity.restaurantName,
      restaurantAddress: entity.restaurantAddress,
      restaurantPhone: entity.restaurantPhone,
      role: entity.role,
    };
    if (password) resource.password = password;
    return resource;
  }
}
