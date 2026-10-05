/**
 * @typedef {Object} RecipeIngredientLine
 * @property {number} inventoryItemId
 * @property {string} inventoryItemName
 * @property {number} quantityRequired
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
    this.ingredients = ingredients.map((line) => ({ ...line, quantityRequired: Number(line.quantityRequired) }));
    this.active = active;
  }

  /**
   * Ingredient lines whose supply does not reach the required quantity.
   *
   * @param {import('./inventory-item.entity.js').InventoryItem[]} items current inventory
   * @returns {RecipeIngredientLine[]}
   */
  missingIngredients(items) {
    return this.ingredients.filter((line) => {
      const item = items.find((candidate) => candidate.id === line.inventoryItemId);
      return !item || !item.canSupply(line.quantityRequired);
    });
  }
}
