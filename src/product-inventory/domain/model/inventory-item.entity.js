/**
 * Storage condition of an inventory item. Display names live in `inventory.storage.*`.
 *
 * @readonly
 * @enum {string}
 */
export const StorageType = Object.freeze({
  AMBIENT: 'AMBIENT',
  REFRIGERATED: 'REFRIGERATED',
  FROZEN: 'FROZEN',
});

/**
 * Stock status derived from quantity, minimum threshold and expiration date.
 * Display names live in `inventory.status.*`.
 *
 * @readonly
 * @enum {string}
 */
export const StockStatus = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  LOW: 'LOW',
  CRITICAL: 'CRITICAL',
  EXPIRED: 'EXPIRED',
});

const MS_PER_DAY = 86400000;

/**
 * Calendar days between today and a `yyyy-mm-dd` date (negative when it already passed).
 *
 * @param {string} isoDate
 * @param {Date} [today]
 * @returns {number}
 */
export function daysUntil(isoDate, today = new Date()) {
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, month, day] = String(isoDate).slice(0, 10).split('-').map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - start) / MS_PER_DAY);
}

/**
 * Expiration date of a new batch: today plus its shelf life, as `yyyy-mm-dd`.
 *
 * @param {number} shelfLifeDays
 * @param {Date} [today]
 * @returns {string}
 */
export function expirationDateFor(shelfLifeDays, today = new Date()) {
  const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) + shelfLifeDays * MS_PER_DAY);
  return date.toISOString().slice(0, 10);
}

/**
 * @typedef {Object} InventoryItemProps
 * @property {number} [id]
 * @property {string} [name]
 * @property {string} [unit]
 * @property {number} [quantity]
 * @property {number} [minThreshold]
 * @property {string} [storageType]
 * @property {number} [shelfLifeDays]
 * @property {string} [expirationDate]
 * @property {number} [unitCost]
 */

/**
 * Aggregate root of the Inventory & Recipe Management Bounded Context:
 * one supply of the restaurant (e.g. chicken breast, flour).
 */
export class InventoryItem {
  /**
   * @param {InventoryItemProps} [props]
   */
  constructor({
    id = 0, name = '', unit = 'kg', quantity = 0, minThreshold = 0,
    storageType = StorageType.AMBIENT, shelfLifeDays = 1, expirationDate = '', unitCost = 0,
  } = {}) {
    this.id = id;
    this.name = name;
    this.unit = unit;
    this.quantity = Number(quantity);
    this.minThreshold = Number(minThreshold);
    this.storageType = storageType;
    this.shelfLifeDays = Number(shelfLifeDays);
    this.expirationDate = expirationDate;
    this.unitCost = Number(unitCost);
  }

  /** @returns {number} days until expiration (negative when expired) */
  get daysToExpire() {
    return daysUntil(this.expirationDate);
  }

  /**
   * Status precedence: Expired > Critical (no stock) > Low (at or below the
   * minimum threshold) > Available.
   *
   * @returns {string} a {@link StockStatus} value
   */
  get status() {
    if (this.daysToExpire < 0) return StockStatus.EXPIRED;
    if (this.quantity <= 0) return StockStatus.CRITICAL;
    if (this.quantity <= this.minThreshold) return StockStatus.LOW;
    return StockStatus.AVAILABLE;
  }

  /** @returns {boolean} expires within the next three days (today included) */
  get isExpiringSoon() {
    return this.daysToExpire >= 0 && this.daysToExpire <= 3;
  }

  /** @returns {boolean} needs attention on the dashboard */
  get needsAttention() {
    return this.status !== StockStatus.AVAILABLE;
  }

  /** @returns {number} quantity × unit cost */
  get stockValue() {
    return this.quantity * this.unitCost;
  }

  /**
   * @param {number} required
   * @returns {boolean}
   */
  canSupply(required) {
    return this.quantity >= required;
  }
}
