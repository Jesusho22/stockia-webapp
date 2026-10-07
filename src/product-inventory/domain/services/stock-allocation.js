import Decimal from 'decimal.js';
import { DecimalQuantity } from '../../../shared/domain/model/decimal-quantity.js';
import { productKeyOf } from '../model/inventory-item.entity.js';

/**
 * Why an ingredient of a recipe cannot be supplied. Display texts live in
 * `recipes.shortage.*`.
 *
 * @readonly
 * @enum {string}
 */
export const ShortageReason = Object.freeze({
  /** The supply does not exist in the inventory anymore. */
  NOT_FOUND: 'NOT_FOUND',
  /** Only expired lots have enough stock: an expired product is never sold. */
  EXPIRED: 'EXPIRED',
  /** The lots that are not expired do not reach the required quantity. */
  INSUFFICIENT: 'INSUFFICIENT',
});

/**
 * @typedef {import('../model/inventory-item.entity.js').InventoryItem} InventoryItem
 * @typedef {import('../model/recipe.entity.js').Recipe} Recipe
 * @typedef {import('../model/recipe.entity.js').RecipeIngredientLine} RecipeIngredientLine
 *
 * @typedef {Object} Shortage
 * @property {string} itemName
 * @property {string} unit
 * @property {string} reason a {@link ShortageReason} value
 * @property {string} required quantity the sale needs (exact text)
 * @property {string} available quantity of lots that are not expired (exact text)
 * @property {string} expired quantity in expired lots (exact text)
 *
 * @typedef {Object} LotDeduction
 * @property {InventoryItem} item lot to update
 * @property {string} taken quantity taken from the lot (exact text)
 * @property {string} remaining new quantity of the lot (exact text)
 *
 * @typedef {Object} AllocationPlan
 * @property {boolean} canFulfill
 * @property {Shortage[]} shortages
 * @property {LotDeduction[]} deductions
 */

/**
 * Lots of the same product as the ingredient line: the linked item plus any
 * other item with the same name and unit.
 *
 * @param {RecipeIngredientLine} line
 * @param {InventoryItem[]} items
 * @returns {InventoryItem[]}
 */
export function lotsForLine(line, items) {
  const linked = items.find((item) => item.id === line.inventoryItemId);
  const key = linked ? linked.productKey : productKeyOf(line.inventoryItemName, line.unit);
  return items.filter((item) => item.productKey === key);
}

/**
 * Lots that can be used, freshest first: not expired, with stock, ordered by
 * the latest expiration date (and the newest lot when dates are equal).
 *
 * @param {InventoryItem[]} lots
 * @returns {InventoryItem[]}
 */
export function usableLotsFreshestFirst(lots) {
  return lots
    .filter((lot) => !lot.isExpired && DecimalQuantity.of(lot.quantity).gt(0))
    .sort((a, b) => String(b.expirationDate).localeCompare(String(a.expirationDate)) || Number(b.id) - Number(a.id));
}

/**
 * Unit cost used for an ingredient: the one of the freshest usable lot, or the
 * linked item when no lot is usable.
 *
 * @param {RecipeIngredientLine} line
 * @param {InventoryItem[]} items
 * @returns {number}
 */
export function unitCostForLine(line, items) {
  const lots = lotsForLine(line, items);
  const freshest = usableLotsFreshestFirst(lots)[0];
  const linked = items.find((item) => item.id === line.inventoryItemId);
  return Number((freshest ?? linked ?? lots[0])?.unitCost ?? 0);
}

/**
 * Cost of the ingredients of one portion: Σ required quantity × unit cost.
 *
 * @param {Recipe} recipe
 * @param {InventoryItem[]} items
 * @returns {Decimal}
 */
export function recipeCost(recipe, items) {
  return recipe.ingredients.reduce(
    (sum, line) => sum.plus(DecimalQuantity.of(line.quantityRequired).times(unitCostForLine(line, items))),
    new Decimal(0),
  );
}

/**
 * Stock allocation for a sale (domain service of Inventory & Recipe Management).
 *
 * @remarks
 * Rules:
 * 1. Expired lots are never used: an expired product cannot be sold.
 * 2. When a product has several lots, the freshest usable lot is used first
 *    and the next one only covers what is missing.
 * 3. If any ingredient cannot be covered, nothing is deducted
 *    (`canFulfill` is false) and the sale must not be registered.
 *
 * @param {Recipe} recipe
 * @param {InventoryItem[]} items current inventory
 * @param {number} [portions]
 * @returns {AllocationPlan}
 */
export function planAllocation(recipe, items, portions = 1) {
  /** @type {Map<number, Decimal>} quantity left in each lot while planning */
  const remaining = new Map(items.map((item) => [item.id, DecimalQuantity.of(item.quantity)]));
  /** @type {Map<number, Decimal>} */
  const taken = new Map();
  const shortages = [];

  for (const line of recipe.ingredients) {
    const required = DecimalQuantity.of(line.quantityRequired).times(portions);
    const lots = lotsForLine(line, items);
    const unit = lots[0]?.unit ?? line.unit;
    if (lots.length === 0) {
      shortages.push({ itemName: line.inventoryItemName, unit, reason: ShortageReason.NOT_FOUND, required: required.toFixed(), available: '0', expired: '0' });
      continue;
    }
    const usable = usableLotsFreshestFirst(lots);
    const available = usable.reduce((sum, lot) => sum.plus(remaining.get(lot.id)), new Decimal(0));
    const expired = lots.filter((lot) => lot.isExpired).reduce((sum, lot) => sum.plus(DecimalQuantity.of(lot.quantity)), new Decimal(0));
    if (available.lt(required)) {
      shortages.push({
        itemName: lots[0].name,
        unit,
        reason: expired.gt(0) ? ShortageReason.EXPIRED : ShortageReason.INSUFFICIENT,
        required: required.toFixed(),
        available: available.toFixed(),
        expired: expired.toFixed(),
      });
      continue;
    }
    let pending = required;
    for (const lot of usable) {
      if (pending.lte(0)) break;
      const take = Decimal.min(pending, remaining.get(lot.id));
      if (take.lte(0)) continue;
      remaining.set(lot.id, remaining.get(lot.id).minus(take));
      taken.set(lot.id, (taken.get(lot.id) ?? new Decimal(0)).plus(take));
      pending = pending.minus(take);
    }
  }

  const deductions = shortages.length > 0 ? [] : [...taken.entries()].map(([id, quantity]) => ({
    item: items.find((item) => item.id === id),
    taken: quantity.toFixed(),
    remaining: remaining.get(id).toFixed(),
  }));
  return { canFulfill: shortages.length === 0, shortages, deductions };
}
