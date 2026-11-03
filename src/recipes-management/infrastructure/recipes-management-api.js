import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const recipesEndpointPath = import.meta.env.VITE_RECIPES_ENDPOINT_PATH;
const salesEndpointPath = import.meta.env.VITE_SALES_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Recipes Management Bounded Context: recipes
 * (dishes and the supplies they consume) and the sales of those dishes. The
 * API validates the stock, prices the dish, records the sale and takes out
 * the supplies in one transaction (Ingredient Deduction Engine).
 */
export class RecipesManagementApi extends BaseApi {
  #recipesEndpoint;
  #salesEndpoint;

  constructor() {
    super();
    this.#recipesEndpoint = new BaseEndpoint(this, recipesEndpointPath);
    this.#salesEndpoint = new BaseEndpoint(this, salesEndpointPath);
  }

  getRecipes() { return this.#recipesEndpoint.getAll(); }
  /** @param {Object} resource */
  createRecipe(resource) { return this.#recipesEndpoint.create(resource); }
  /** @param {number} id @param {Object} resource */
  updateRecipe(id, resource) { return this.#recipesEndpoint.update(id, resource); }
  /** @param {number} id */
  deleteRecipe(id) { return this.#recipesEndpoint.delete(id); }

  getSales() { return this.#salesEndpoint.getAll(); }
  /** @param {{recipeId: number, quantity: number, channel: string}} sale */
  registerSale(sale) { return this.#salesEndpoint.create(sale); }
  /** @param {number} id */
  voidSale(id) { return this.#salesEndpoint.post(`${id}/void`); }
}
