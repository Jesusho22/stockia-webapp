import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const inventoryItemsEndpointPath = import.meta.env.VITE_INVENTORY_ITEMS_ENDPOINT_PATH;
const recipesEndpointPath = import.meta.env.VITE_RECIPES_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Inventory & Recipe Management Bounded Context.
 */
export class InventoryApi extends BaseApi {
  #inventoryItemsEndpoint;
  #recipesEndpoint;

  constructor() {
    super();
    this.#inventoryItemsEndpoint = new BaseEndpoint(this, inventoryItemsEndpointPath);
    this.#recipesEndpoint = new BaseEndpoint(this, recipesEndpointPath);
  }

  getInventoryItems() { return this.#inventoryItemsEndpoint.getAll(); }
  /** @param {Object} resource */
  createInventoryItem(resource) { return this.#inventoryItemsEndpoint.create(resource); }
  /** @param {number} id @param {Object} resource */
  updateInventoryItem(id, resource) { return this.#inventoryItemsEndpoint.update(id, resource); }
  /** @param {number} id */
  deleteInventoryItem(id) { return this.#inventoryItemsEndpoint.delete(id); }

  getRecipes() { return this.#recipesEndpoint.getAll(); }
  /** @param {Object} resource */
  createRecipe(resource) { return this.#recipesEndpoint.create(resource); }
  /** @param {number} id @param {Object} resource */
  updateRecipe(id, resource) { return this.#recipesEndpoint.update(id, resource); }
  /** @param {number} id */
  deleteRecipe(id) { return this.#recipesEndpoint.delete(id); }
}
