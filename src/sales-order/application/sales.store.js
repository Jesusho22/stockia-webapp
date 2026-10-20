import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SalesApi } from '../infrastructure/sales-api.js';
import { SaleAssembler } from '../infrastructure/sale.assembler.js';
import { Sale, SaleChannel } from '../domain/model/sale.entity.js';
import { useInventoryStore } from '../../product-inventory/application/inventory.store.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';
import { problemOf, toBusinessRuleError } from '../../shared/infrastructure/api-error.js';

const salesApi = new SalesApi();

/**
 * Application layer of the Sales & Order Management Bounded Context.
 *
 * @remarks
 * `registerSale` asks the StockIA Platform API to sell one portion. The API
 * (SaleRegistrationService) checks the stock first and answers 422 CannotSell
 * — without recording anything — when a supply is missing, short or only
 * available in expired lots; its `details.shortages` feed the "Sale not
 * processed" dialog. The price of the dish is the sum of its ingredient costs.
 * Voiding a sale does not return stock.
 */
export const useSalesStore = defineStore('sales', () => {
  /** @type {import('vue').Ref<Sale[]>} */
  const sales = ref([]);
  const loaded = ref(false);

  const confirmedSales = computed(() => sales.value.filter((sale) => sale.isConfirmed));
  const totalRevenue = computed(() => confirmedSales.value.reduce((sum, sale) => sum + sale.total, 0));
  // Newest first: by sale date, then by id (the API assigns increasing ids).
  const sortedSales = computed(() => [...sales.value].sort((a, b) => String(b.saleDate).localeCompare(String(a.saleDate)) || Number(b.id) - Number(a.id)));

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
    let created;
    try {
      const response = await salesApi.registerSale({ recipeId, quantity: 1, channel: SaleChannel.POS });
      created = SaleAssembler.toEntityFromResource(response.data);
    } catch (error) {
      const problem = problemOf(error);
      if (problem?.title === 'CannotSell') {
        const recipe = inventoryStore.recipes.find((candidate) => candidate.id === recipeId);
        throw new BusinessRuleError('sales.errors.cannot-sell', {
          dish: problem.details?.dish ?? recipe?.dishName ?? '',
          shortages: problem.details?.shortages ?? [],
        });
      }
      throw toBusinessRuleError(error, { RecipeNotFound: 'sales.errors.recipe-not-found' });
    }
    sales.value = [created, ...sales.value];
    // The API discounted the supplies (DishSold): refresh the stock shown.
    await inventoryStore.loadItems();
    return created;
  }

  /**
   * Voids a confirmed sale. The supplies already used are not returned to stock.
   *
   * @param {Sale} sale
   */
  async function voidSale(sale) {
    if (!sale.isConfirmed) throw new BusinessRuleError('sales.errors.already-voided');
    try {
      const { data } = await salesApi.voidSale(sale.id);
      const voided = SaleAssembler.toEntityFromResource(data);
      sales.value = sales.value.map((candidate) => (candidate.id === sale.id ? voided : candidate));
    } catch (error) {
      throw toBusinessRuleError(error, { AlreadyVoided: 'sales.errors.already-voided' });
    }
  }

  return { sales, loaded, confirmedSales, totalRevenue, sortedSales, loadSales, registerSale, voidSale };
});
