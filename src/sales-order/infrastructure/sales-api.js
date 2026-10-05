import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const salesEndpointPath = import.meta.env.VITE_SALES_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Sales & Order Management Bounded Context
 * (SaleRepository over the API).
 */
export class SalesApi extends BaseApi {
  #salesEndpoint;

  constructor() {
    super();
    this.#salesEndpoint = new BaseEndpoint(this, salesEndpointPath);
  }

  getSales() { return this.#salesEndpoint.getAll(); }
  /** @param {Object} resource */
  createSale(resource) { return this.#salesEndpoint.create(resource); }
  /** @param {number} id @param {Object} resource complete sale resource */
  updateSale(id, resource) { return this.#salesEndpoint.update(id, resource); }
}
