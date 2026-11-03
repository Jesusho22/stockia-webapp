/**
 * @typedef {Object} RestaurantProps
 * @property {number} [id]
 * @property {string} [name]
 * @property {string} [address]
 * @property {string} [phone]
 */

/**
 * Aggregate root of the Restaurant Registration Bounded Context: the
 * restaurant (one per account) and its contact data. Its owner is the first
 * Administrator of Identity & Access Management.
 */
export class Restaurant {
  /** @param {RestaurantProps} [props] */
  constructor({ id = 0, name = '', address = '', phone = '' } = {}) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.phone = phone;
  }
}
