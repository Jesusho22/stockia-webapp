import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const inventoryItemsEndpointPath = import.meta.env.VITE_INVENTORY_ITEMS_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Stock Management Bounded Context: supplies
 * (lots) of the restaurant in the StockIA Platform API.
 */
export class StockManagementApi extends BaseApi {
  #inventoryItemsEndpoint;

  constructor() {
    super();
    this.#inventoryItemsEndpoint = new BaseEndpoint(this, inventoryItemsEndpointPath);
  }

  getInventoryItems() { return this.#inventoryItemsEndpoint.getAll(); }
  /** @param {Object} resource */
  createInventoryItem(resource) { return this.#inventoryItemsEndpoint.create(resource); }
  /** @param {number} id @param {Object} resource */
  updateInventoryItem(id, resource) { return this.#inventoryItemsEndpoint.update(id, resource); }
  /** @param {number} id */
  deleteInventoryItem(id) { return this.#inventoryItemsEndpoint.delete(id); }
}
