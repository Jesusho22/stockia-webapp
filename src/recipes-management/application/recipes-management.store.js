import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { RecipesManagementApi } from '../infrastructure/recipes-management-api.js';
import { RecipeAssembler } from '../infrastructure/recipe.assembler.js';
import { SaleAssembler } from '../infrastructure/sale.assembler.js';
import { Recipe } from '../domain/model/recipe.entity.js';
import { Sale, SaleChannel } from '../domain/model/sale.entity.js';
import { useStockManagementStore } from '../../stock-management/application/stock-management.store.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';
import { problemOf, toBusinessRuleError } from '../../shared/infrastructure/api-error.js';

const recipesManagementApi = new RecipesManagementApi();

/**
 * Application layer of the Recipes Management Bounded Context: the recipes
 * (dishes and the supplies they consume) and the sales of those dishes.
 *
 * @remarks
 * `registerSale` asks the StockIA Platform API to sell one portion ("Dish
 * Sold"). The API (Ingredient Deduction Engine) checks the stock first and
 * answers 422 CannotSell — without recording anything — when a supply is
 * missing, short or only available in expired lots; its `details.shortages`
 * feed the "Sale not processed" dialog. The price of a dish is the sum of its
 * ingredient costs. Voiding a sale does not return stock. Stock Management is
 * only reached through its store.
 */
export const useRecipesManagementStore = defineStore('recipes-management', () => {
  /** @type {import('vue').Ref<Recipe[]>} */
  const recipes = ref([]);
  const recipesLoaded = ref(false);
  /** @type {import('vue').Ref<Sale[]>} */
  const sales = ref([]);
  const salesLoaded = ref(false);

  const confirmedSales = computed(() => sales.value.filter((sale) => sale.isConfirmed));
  const totalRevenue = computed(() => confirmedSales.value.reduce((sum, sale) => sum + sale.total, 0));
  // Newest first: by sale date, then by id (the API assigns increasing ids).
  const sortedSales = computed(() => [...sales.value].sort((a, b) => String(b.saleDate).localeCompare(String(a.saleDate)) || Number(b.id) - Number(a.id)));

  async function loadRecipes() {
    const response = await recipesManagementApi.getRecipes();
    recipes.value = RecipeAssembler.toEntitiesFromResponse(response).sort((a, b) => Number(b.id) - Number(a.id));
    recipesLoaded.value = true;
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
      await recipesManagementApi.updateRecipe(id, resource);
    } else {
      delete resource.id;
      await recipesManagementApi.createRecipe(resource);
    }
    await loadRecipes();
  }

  /** @param {Recipe} recipe */
  async function deleteRecipe(recipe) {
    await recipesManagementApi.deleteRecipe(recipe.id);
    await loadRecipes();
  }

  /**
   * Price of a dish: sum of the cost of its ingredients (see {@link Recipe#priceWith}).
   *
   * @param {Recipe} recipe
   * @returns {number}
   */
  function priceOf(recipe) {
    return recipe.priceWith(useStockManagementStore().items);
  }

  async function loadSales() {
    const response = await recipesManagementApi.getSales();
    sales.value = SaleAssembler.toEntitiesFromResponse(response);
    salesLoaded.value = true;
  }

  /**
   * Sells one portion of the dish of a recipe.
   *
   * @param {number} recipeId
   * @returns {Promise<Sale>}
   */
  async function registerSale(recipeId) {
    let created;
    try {
      const response = await recipesManagementApi.registerSale({ recipeId, quantity: 1, channel: SaleChannel.POS });
      created = SaleAssembler.toEntityFromResource(response.data);
    } catch (error) {
      const problem = problemOf(error);
      if (problem?.title === 'CannotSell') {
        const recipe = recipes.value.find((candidate) => candidate.id === recipeId);
        throw new BusinessRuleError('sales.errors.cannot-sell', {
          dish: problem.details?.dish ?? recipe?.dishName ?? '',
          shortages: problem.details?.shortages ?? [],
        });
      }
      throw toBusinessRuleError(error, { RecipeNotFound: 'sales.errors.recipe-not-found' });
    }
    sales.value = [created, ...sales.value];
    // The API took out the supplies (Dish Sold): refresh the stock shown.
    await useStockManagementStore().loadItems();
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
      const { data } = await recipesManagementApi.voidSale(sale.id);
      const voided = SaleAssembler.toEntityFromResource(data);
      sales.value = sales.value.map((candidate) => (candidate.id === sale.id ? voided : candidate));
    } catch (error) {
      throw toBusinessRuleError(error, { AlreadyVoided: 'sales.errors.already-voided' });
    }
  }

  return {
    recipes, recipesLoaded, sales, salesLoaded, confirmedSales, totalRevenue, sortedSales,
    loadRecipes, saveRecipe, deleteRecipe, priceOf, loadSales, registerSale, voidSale,
  };
});
