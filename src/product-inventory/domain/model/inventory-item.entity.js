import { DecimalQuantity } from '../../../shared/domain/model/decimal-quantity.js';

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
 * Key that identifies a product regardless of its lot: name and unit,
 * lower-case and with single spaces.
 *
 * @param {string} name
 * @param {string} unit
 * @returns {string}
 */
export function productKeyOf(name, unit) {
  const normalize = (text) => String(text ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${normalize(name)}|${normalize(unit)}`;
}

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
 * @property {number|string} [quantity] up to 32 decimals
 * @property {number|string} [minThreshold] up to 32 decimals
 * @property {string} [storageType]
 * @property {number} [shelfLifeDays]
 * @property {string} [expirationDate]
 * @property {number} [unitCost]
 */

/**
 * Aggregate root of the Inventory & Recipe Management Bounded Context:
 * one supply (lot) of the restaurant (e.g. chicken breast, flour).
 *
 * @remarks
 * `quantity` and `minThreshold` are kept as exact decimal text (up to 32
 * decimals, see {@link DecimalQuantity}). Two items with the same name and
 * unit are two lots of the same product; the stock allocation service picks
 * the freshest lot that is not expired.
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
    this.quantity = DecimalQuantity.toText(quantity);
    this.minThreshold = DecimalQuantity.toText(minThreshold);
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
    if (this.isExpired) return StockStatus.EXPIRED;
    const quantity = DecimalQuantity.of(this.quantity);
    if (quantity.lte(0)) return StockStatus.CRITICAL;
    if (quantity.lte(DecimalQuantity.of(this.minThreshold))) return StockStatus.LOW;
    return StockStatus.AVAILABLE;
  }

  /** @returns {boolean} the expiration date already passed: this lot cannot be sold */
  get isExpired() {
    return Boolean(this.expirationDate) && this.daysToExpire < 0;
  }

  /** @returns {boolean} expires within the next three days (today included) */
  get isExpiringSoon() {
    return this.daysToExpire >= 0 && this.daysToExpire <= 3;
  }

  /** @returns {boolean} needs attention on the dashboard */
  get needsAttention() {
    return this.status !== StockStatus.AVAILABLE;
  }

  /** @returns {number} quantity × unit cost, in soles */
  get stockValue() {
    return DecimalQuantity.of(this.quantity).times(this.unitCost).toNumber();
  }

  /**
   * Same product: equal name and unit (case and extra spaces ignored).
   *
   * @returns {string}
   */
  get productKey() {
    return productKeyOf(this.name, this.unit);
  }

  /**
   * True when this lot is not expired and has at least the required quantity.
   *
   * @param {number|string} required
   * @returns {boolean}
   */
  canSupply(required) {
    return !this.isExpired && DecimalQuantity.of(this.quantity).gte(DecimalQuantity.of(required));
  }
}
