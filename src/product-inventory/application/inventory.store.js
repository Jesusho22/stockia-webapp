import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { InventoryApi } from '../infrastructure/inventory-api.js';
import { InventoryItemAssembler } from '../infrastructure/inventory-item.assembler.js';
import { RecipeAssembler } from '../infrastructure/recipe.assembler.js';
import { InventoryItem, StockStatus, expirationDateFor } from '../domain/model/inventory-item.entity.js';
import { Recipe } from '../domain/model/recipe.entity.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';
import { planAllocation } from '../domain/services/stock-allocation.js';

const inventoryApi = new InventoryApi();

/**
 * The API assigns increasing ids, so the highest id is the last one added.
 *
 * @template {{id: number}} T
 * @param {T[]} list
 * @returns {T[]}
 */
function newestFirst(list) {
  return [...list].sort((a, b) => Number(b.id) - Number(a.id));
}

/**
 * Application layer of the Inventory & Recipe Management Bounded Context.
 *
 * @remarks
 * - `planSale` checks a recipe against the stock with the allocation domain
 *   service (expired lots are never used; the freshest lot goes first).
 * - `deductStockForRecipe` plays the role of RecipeStockDeductionService: it is
 *   invoked by the Sales & Order Management store right after a sale is
 *   confirmed (reaction to the `DishSold` domain event), never by the UI.
 * - Lists are kept newest first, so a new supply or recipe appears at the top.
 */
export const useInventoryStore = defineStore('inventory', () => {
  /** @type {import('vue').Ref<InventoryItem[]>} */
  const items = ref([]);
  /** @type {import('vue').Ref<Recipe[]>} */
  const recipes = ref([]);
  const itemsLoaded = ref(false);
  const recipesLoaded = ref(false);

  const attentionCount = computed(() => items.value.filter((item) => item.status === StockStatus.LOW || item.status === StockStatus.CRITICAL).length);
  const expiringSoonCount = computed(() => items.value.filter((item) => item.isExpiringSoon).length);
  const inventoryValue = computed(() => items.value.reduce((sum, item) => sum + item.stockValue, 0));
  const itemsNeedingAttention = computed(() => items.value.filter((item) => item.needsAttention));

  async function loadItems() {
    const response = await inventoryApi.getInventoryItems();
    items.value = newestFirst(InventoryItemAssembler.toEntitiesFromResponse(response));
    itemsLoaded.value = true;
  }

  async function loadRecipes() {
    const response = await inventoryApi.getRecipes();
    recipes.value = newestFirst(RecipeAssembler.toEntitiesFromResponse(response));
    recipesLoaded.value = true;
  }

  /**
   * Registers or edits a supply. The expiration date is recalculated from the
   * shelf life every time the batch is saved.
   *
   * @param {{name: string, unit: string, quantity: string, minThreshold: string, storageType: string, shelfLifeDays: number, unitCost: number}} form
   *   quantities as text with up to 32 decimals
   * @param {number|null} id `null` to create a new supply
   */
  async function saveItem(form, id = null) {
    const item = new InventoryItem({ ...form, id: id ?? 0, name: form.name.trim(), unit: form.unit.trim(), expirationDate: expirationDateFor(form.shelfLifeDays) });
    const resource = InventoryItemAssembler.toResourceFromEntity(item);
    if (id) {
      await inventoryApi.updateInventoryItem(id, resource);
    } else {
      delete resource.id;
      await inventoryApi.createInventoryItem(resource);
    }
    await loadItems();
  }

  /** @param {InventoryItem} item */
  async function deleteItem(item) {
    await inventoryApi.deleteInventoryItem(item.id);
    await loadItems();
  }

  /**
   * @param {{dishName: string, ingredients: import('../domain/model/recipe.entity.js').RecipeIngredientLine[]}} form
   * @param {number|null} id `null` to create a new recipe
   */
  async function saveRecipe(form, id = null) {
    if (!form.dishName.trim() || form.ingredients.length === 0) throw new BusinessRuleError('recipes.errors.incomplete');
    const recipe = new Recipe({ id: id ?? 0, dishName: form.dishName.trim(), ingredients: form.ingredients, active: true });
    const resource = RecipeAssembler.toResourceFromEntity(recipe);
    if (id) {
      await inventoryApi.updateRecipe(id, resource);
    } else {
      delete resource.id;
      await inventoryApi.createRecipe(resource);
    }
    await loadRecipes();
  }

  /** @param {Recipe} recipe */
  async function deleteRecipe(recipe) {
    await inventoryApi.deleteRecipe(recipe.id);
    await loadRecipes();
  }

  /**
   * Price of a dish: sum of the cost of its ingredients (see {@link Recipe#priceWith}).
   *
   * @param {Recipe} recipe
   * @returns {number}
   */
  function priceOf(recipe) {
    return recipe.priceWith(items.value);
  }

  /**
   * Checks whether the stock can supply the recipe, without changing anything.
   *
   * @param {Recipe} recipe
   * @param {number} [portions]
   * @returns {import('../domain/services/stock-allocation.js').AllocationPlan}
   */
  function planSale(recipe, portions = 1) {
    return planAllocation(recipe, items.value, portions);
  }

  /**
   * RecipeStockDeductionService: discounts from the lots the quantity the
   * sold recipe requires, freshest lot first and never from an expired lot.
   *
   * @param {Recipe} recipe
   * @param {number} [portions]
   */
  async function deductStockForRecipe(recipe, portions = 1) {
    const plan = planSale(recipe, portions);
    if (!plan.canFulfill) throw new BusinessRuleError('sales.errors.cannot-sell', { dish: recipe.dishName, shortages: plan.shortages });
    await Promise.all(plan.deductions.map(({ item, remaining }) => {
      const resource = InventoryItemAssembler.toResourceFromEntity(new InventoryItem({ ...item, quantity: remaining }));
      return inventoryApi.updateInventoryItem(item.id, resource);
    }));
    await loadItems();
  }

  return {
    items, recipes, itemsLoaded, recipesLoaded, attentionCount, expiringSoonCount, inventoryValue, itemsNeedingAttention,
    loadItems, loadRecipes, saveItem, deleteItem, saveRecipe, deleteRecipe, priceOf, planSale, deductStockForRecipe,
  };
});
