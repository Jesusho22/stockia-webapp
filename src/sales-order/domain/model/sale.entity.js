/**
 * Channel where the sale was originated. Display names live in `sales.channel.*`.
 *
 * @readonly
 * @enum {string}
 */
export const SaleChannel = Object.freeze({
  POS: 'POS',
  MANUAL: 'MANUAL',
});

/**
 * Life cycle of a sale: a confirmed sale is immutable and can only be voided.
 * Display names live in `sales.status.*`.
 *
 * @readonly
 * @enum {string}
 */
export const SaleStatus = Object.freeze({
  CONFIRMED: 'CONFIRMED',
  VOIDED: 'VOIDED',
});

/**
 * @typedef {Object} SaleLineItem
 * @property {number} recipeId
 * @property {string} dishName
 * @property {number} unitPrice
 * @property {number} quantity
 */

/**
 * @typedef {Object} SaleProps
 * @property {number} [id]
 * @property {string} [saleDate]
 * @property {string} [channel]
 * @property {string} [status]
 * @property {SaleLineItem[]} [lineItems]
 */

/**
 * Aggregate root of the Sales & Order Management Bounded Context.
 */
export class Sale {
  /**
   * @param {SaleProps} [props]
   */
  constructor({ id = 0, saleDate = '', channel = SaleChannel.POS, status = SaleStatus.CONFIRMED, lineItems = [] } = {}) {
    this.id = id;
    this.saleDate = saleDate;
    this.channel = channel;
    this.status = status;
    this.lineItems = lineItems.map((line) => ({ ...line, unitPrice: Number(line.unitPrice), quantity: Number(line.quantity) }));
  }

  /** @returns {number} sum of unit price × quantity of every line */
  get total() {
    return this.lineItems.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  }

  /** @returns {boolean} */
  get isConfirmed() {
    return this.status === SaleStatus.CONFIRMED;
  }

  /** @returns {string} e.g. "Pizza Margarita ×1, Lomo Saltado ×2" */
  get dishesSummary() {
    return this.lineItems.map((line) => `${line.dishName} ×${line.quantity}`).join(', ');
  }
}
