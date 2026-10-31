import { UserRole } from './user-role.js';

/**
 * @typedef {Object} UserProps
 * @property {number} [id]
 * @property {string} [fullName]
 * @property {string} [email]
 * @property {number} [restaurantId]
 * @property {string} [restaurantName]
 * @property {string} [restaurantAddress]
 * @property {string} [restaurantPhone]
 * @property {string} [role]
 * @property {boolean} [locked] locked by wrong passwords (Account Lock Service)
 * @property {string|null} [lockedUntil] ISO date until the account opens again
 */

/**
 * Domain entity of the Identity & Access Management Bounded Context: a member of
 * the restaurant team, with the data of the restaurant it works for. It never stores the password; credentials only travel
 * through the infrastructure layer.
 */
export class User {
  /**
   * @param {UserProps} [props]
   */
  constructor({
    id = 0, fullName = '', email = '', restaurantId = 0, restaurantName = '', restaurantAddress = '', restaurantPhone = '',
    role = UserRole.EMPLOYEE, locked = false, lockedUntil = null,
  } = {}) {
    this.id = id;
    this.restaurantId = restaurantId;
    this.fullName = fullName;
    this.email = email;
    this.restaurantName = restaurantName;
    this.restaurantAddress = restaurantAddress;
    this.restaurantPhone = restaurantPhone;
    this.role = role;
    this.locked = locked;
    this.lockedUntil = lockedUntil;
  }

  /** @returns {boolean} */
  get isAdmin() {
    return this.role === UserRole.ADMIN;
  }
}
