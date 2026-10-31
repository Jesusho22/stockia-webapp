import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const alertsEndpointPath = import.meta.env.VITE_ALERTS_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Notifications & Messaging Bounded Context.
 * Acknowledging and delivering are actions of the API, which checks the
 * delivery rule (critical alerts need WhatsApp and email).
 */
export class AlertsApi extends BaseApi {
  #alertsEndpoint;

  constructor() {
    super();
    this.#alertsEndpoint = new BaseEndpoint(this, alertsEndpointPath);
  }

  getAlerts() { return this.#alertsEndpoint.getAll(); }
  /** @param {{type: string, severity: string, message: string, channel: string}} alert */
  createAlert(alert) { return this.#alertsEndpoint.create(alert); }
  /** @param {number} id @param {{type: string, severity: string, message: string, channel: string}} alert */
  updateAlert(id, alert) { return this.#alertsEndpoint.update(id, alert); }
  /** @param {number} id */
  deleteAlert(id) { return this.#alertsEndpoint.delete(id); }
  /** @param {number} id */
  acknowledgeAlert(id) { return this.#alertsEndpoint.post(`${id}/acknowledge`); }
  /** @param {number} id */
  retryDelivery(id) { return this.#alertsEndpoint.post(`${id}/deliveries`); }
}
