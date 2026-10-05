import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SalesApi } from '../infrastructure/sales-api.js';
import { SaleAssembler } from '../infrastructure/sale.assembler.js';
import { Sale, SaleChannel, SaleStatus } from '../domain/model/sale.entity.js';
import { useInventoryStore } from '../../product-inventory/application/inventory.store.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';

/**
 * Reference price per dish. Pricing is not modeled as a Bounded Context yet,
 * so a simple map gives a plausible price for the demo menu.
 */
const DEFAULT_DISH_PRICE = 25;
const DISH_PRICE_BY_NAME = {
  'Pizza Margarita': 28,
  'Lomo Saltado': 32,
  'Ensalada César con Pollo': 22,
};

const salesApi = new SalesApi();

/**
 * Application layer of the Sales & Order Management Bounded Context.
 *
 * @remarks
 * `registerSale` implements SaleRegistrationService: it validates the stock
 * against the read model of Inventory & Recipe Management BEFORE confirming
 * the sale, and only after the API confirms it triggers the stock deduction
 * (simulated `DishSold` event). Voiding a sale does not return stock.
 */
export const useSalesStore = defineStore('sales', () => {
  /** @type {import('vue').Ref<Sale[]>} */
  const sales = ref([]);
  const loaded = ref(false);

  const confirmedSales = computed(() => sales.value.filter((sale) => sale.isConfirmed));
  const totalRevenue = computed(() => confirmedSales.value.reduce((sum, sale) => sum + sale.total, 0));
  const sortedSales = computed(() => [...sales.value].sort((a, b) => String(b.saleDate).localeCompare(String(a.saleDate))));

  async function loadSales() {
    const response = await salesApi.getSales();
    sales.value = SaleAssembler.toEntitiesFromResponse(response);
    loaded.value = true;
  }

  /**
   * Sells one portion of the dish of a recipe.
   *
   * @param {number} recipeId
   * @returns {Promise<Sale>}
   */
  async function registerSale(recipeId) {
    const inventoryStore = useInventoryStore();
    // Always validate against fresh stock, never against a stale screen.
    await Promise.all([inventoryStore.loadItems(), inventoryStore.loadRecipes()]);

    const recipe = inventoryStore.recipes.find((candidate) => candidate.id === recipeId);
    if (!recipe) throw new BusinessRuleError('sales.errors.recipe-not-found');

    const missing = recipe.missingIngredients(inventoryStore.items);
    if (missing.length > 0) {
      throw new BusinessRuleError('sales.errors.insufficient-stock', {
        dish: recipe.dishName,
        items: missing.map((line) => line.inventoryItemName).join(', '),
      });
    }

    const sale = new Sale({
      saleDate: new Date().toISOString(),
      channel: SaleChannel.POS,
      status: SaleStatus.CONFIRMED,
      lineItems: [{ recipeId: recipe.id, dishName: recipe.dishName, unitPrice: DISH_PRICE_BY_NAME[recipe.dishName] ?? DEFAULT_DISH_PRICE, quantity: 1 }],
    });
    const resource = SaleAssembler.toResourceFromEntity(sale);
    delete resource.id;
    const response = await salesApi.createSale(resource);
    const created = SaleAssembler.toEntityFromResource(response.data);
    sales.value = [...sales.value, created];

    // DishSold → RecipeStockDeductionService (Inventory & Recipe Management).
    await inventoryStore.deductStockForRecipe(recipe);
    return created;
  }

  /**
   * Voids a confirmed sale. The supplies already used are not returned to stock.
   *
   * @param {Sale} sale
   */
  async function voidSale(sale) {
    if (!sale.isConfirmed) throw new BusinessRuleError('sales.errors.already-voided');
    const voided = new Sale({ ...sale, status: SaleStatus.VOIDED });
    await salesApi.updateSale(sale.id, SaleAssembler.toResourceFromEntity(voided));
    sales.value = sales.value.map((candidate) => (candidate.id === sale.id ? voided : candidate));
  }

  return { sales, loaded, confirmedSales, totalRevenue, sortedSales, loadSales, registerSale, voidSale };
});
