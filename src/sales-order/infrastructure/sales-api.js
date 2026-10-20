import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const salesEndpointPath = import.meta.env.VITE_SALES_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Sales & Order Management Bounded Context.
 * The API validates the stock, prices the dish, records the sale and
 * discounts the supplies in one transaction.
 */
export class SalesApi extends BaseApi {
  #salesEndpoint;

  constructor() {
    super();
    this.#salesEndpoint = new BaseEndpoint(this, salesEndpointPath);
  }

  getSales() { return this.#salesEndpoint.getAll(); }

  /** @param {{recipeId: number, quantity: number, channel: string}} sale */
  registerSale(sale) { return this.#salesEndpoint.create(sale); }

  /** @param {number} id */
  voidSale(id) { return this.#salesEndpoint.post(`${id}/void`); }
}
