import { DecimalQuantity } from '../../../shared/domain/model/decimal-quantity.js';
import { planAllocation, recipeCost } from '../services/stock-allocation.js';

/**
 * @typedef {Object} RecipeIngredientLine
 * @property {number} inventoryItemId
 * @property {string} inventoryItemName
 * @property {string} quantityRequired exact decimal text (up to 32 decimals)
 * @property {string} unit
 */

/**
 * @typedef {Object} RecipeProps
 * @property {number} [id]
 * @property {string} [dishName]
 * @property {RecipeIngredientLine[]} [ingredients]
 * @property {boolean} [active]
 */

/**
 * Entity of the Inventory & Recipe Management Bounded Context: a dish of the
 * menu and the supplies (by identity) it consumes each time it is sold.
 */
export class Recipe {
  /**
   * @param {RecipeProps} [props]
   */
  constructor({ id = 0, dishName = '', ingredients = [], active = true } = {}) {
    this.id = id;
    this.dishName = dishName;
    this.ingredients = ingredients.map((line) => ({ ...line, quantityRequired: DecimalQuantity.toText(line.quantityRequired) }));
    this.active = active;
  }

  /**
   * Price of the dish: the sum of the cost of the ingredients used in one
   * portion (required quantity × unit cost of the freshest usable lot),
   * rounded to cents.
   *
   * @param {import('./inventory-item.entity.js').InventoryItem[]} items current inventory
   * @returns {number}
   */
  priceWith(items) {
    return recipeCost(this, items).toDecimalPlaces(2).toNumber();
  }

  /**
   * Ingredient lines that cannot be supplied (missing, expired or short).
   *
   * @param {import('./inventory-item.entity.js').InventoryItem[]} items current inventory
   * @returns {import('../services/stock-allocation.js').Shortage[]}
   */
  shortagesWith(items) {
    return planAllocation(this, items).shortages;
  }
}
