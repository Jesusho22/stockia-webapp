/**
 * @typedef {Object} PlanProps
 * @property {number} [id]
 * @property {string} [name]
 * @property {number} [monthlyPrice] in soles (PEN)
 * @property {string[]} [features]
 * @property {boolean} [highlighted]
 */

/**
 * Entity of the Subscription & Billing Bounded Context: a plan of the catalog.
 */
export class Plan {
  /**
   * @param {PlanProps} [props]
   */
  constructor({ id = 0, name = '', monthlyPrice = 0, features = [], highlighted = false } = {}) {
    this.id = id;
    this.name = name;
    this.monthlyPrice = Number(monthlyPrice);
    this.features = [...features];
    this.highlighted = highlighted;
  }
}
