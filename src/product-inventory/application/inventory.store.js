import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { InventoryApi } from '../infrastructure/inventory-api.js';
import { InventoryItemAssembler } from '../infrastructure/inventory-item.assembler.js';
import { RecipeAssembler } from '../infrastructure/recipe.assembler.js';
import { InventoryItem, StockStatus, expirationDateFor } from '../domain/model/inventory-item.entity.js';
import { Recipe } from '../domain/model/recipe.entity.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';

const inventoryApi = new InventoryApi();

/**
 * Application layer of the Inventory & Recipe Management Bounded Context.
 *
 * @remarks
 * `deductStockForRecipe` plays the role of RecipeStockDeductionService: it is
 * invoked by the Sales & Order Management store right after a sale is
 * confirmed (reaction to the `DishSold` domain event), never by the UI.
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
    items.value = InventoryItemAssembler.toEntitiesFromResponse(response);
    itemsLoaded.value = true;
  }

  async function loadRecipes() {
    const response = await inventoryApi.getRecipes();
    recipes.value = RecipeAssembler.toEntitiesFromResponse(response);
    recipesLoaded.value = true;
  }

  /**
   * Registers or edits a supply. The expiration date is recalculated from the
   * shelf life every time the batch is saved.
   *
   * @param {{name: string, unit: string, quantity: number, minThreshold: number, storageType: string, shelfLifeDays: number, unitCost: number}} form
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
   * RecipeStockDeductionService: discounts from each supply the quantity the
   * sold recipe requires. Stock never goes below zero.
   *
   * @param {Recipe} recipe
   * @param {number} [portions]
   */
  async function deductStockForRecipe(recipe, portions = 1) {
    const updates = recipe.ingredients.map((line) => {
      const item = items.value.find((candidate) => candidate.id === line.inventoryItemId);
      if (!item) return null;
      const quantity = Math.max(0, Number((item.quantity - line.quantityRequired * portions).toFixed(3)));
      const resource = InventoryItemAssembler.toResourceFromEntity(new InventoryItem({ ...item, quantity }));
      return inventoryApi.updateInventoryItem(item.id, resource);
    }).filter(Boolean);
    await Promise.all(updates);
    await loadItems();
  }

  return {
    items, recipes, itemsLoaded, recipesLoaded, attentionCount, expiringSoonCount, inventoryValue, itemsNeedingAttention,
    loadItems, loadRecipes, saveItem, deleteItem, saveRecipe, deleteRecipe, deductStockForRecipe,
  };
});
