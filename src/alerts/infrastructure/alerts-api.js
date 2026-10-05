import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const alertsEndpointPath = import.meta.env.VITE_ALERTS_ENDPOINT_PATH;
const recommendationsEndpointPath = import.meta.env.VITE_RECOMMENDATIONS_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Alerts & Recommendations Bounded Context.
 */
export class AlertsApi extends BaseApi {
  #alertsEndpoint;
  #recommendationsEndpoint;

  constructor() {
    super();
    this.#alertsEndpoint = new BaseEndpoint(this, alertsEndpointPath);
    this.#recommendationsEndpoint = new BaseEndpoint(this, recommendationsEndpointPath);
  }

  getAlerts() { return this.#alertsEndpoint.getAll(); }
  /** @param {Object} resource */
  createAlert(resource) { return this.#alertsEndpoint.create(resource); }
  /** @param {number} id @param {Object} resource complete alert resource */
  updateAlert(id, resource) { return this.#alertsEndpoint.update(id, resource); }
  /** @param {number} id */
  deleteAlert(id) { return this.#alertsEndpoint.delete(id); }

  getRecommendations() { return this.#recommendationsEndpoint.getAll(); }
  /** @param {number} id @param {Object} resource complete recommendation resource */
  updateRecommendation(id, resource) { return this.#recommendationsEndpoint.update(id, resource); }
}
