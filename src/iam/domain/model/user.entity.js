import { UserRole } from './user-role.js';

/**
 * @typedef {Object} UserProps
 * @property {number} [id]
 * @property {string} [fullName]
 * @property {string} [email]
 * @property {string} [restaurantName]
 * @property {string} [role]
 */

/**
 * Domain entity of the User & Access Management Bounded Context: a member of
 * the restaurant team. It never stores the password; credentials only travel
 * through the infrastructure layer.
 */
export class User {
  /**
   * @param {UserProps} [props]
   */
  constructor({ id = 0, fullName = '', email = '', restaurantName = '', role = UserRole.EMPLOYEE } = {}) {
    this.id = id;
    this.fullName = fullName;
    this.email = email;
    this.restaurantName = restaurantName;
    this.role = role;
  }

  /** @returns {boolean} */
  get isAdmin() {
    return this.role === UserRole.ADMIN;
  }
}
