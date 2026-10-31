import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const dashboardEndpointPath = import.meta.env.VITE_DASHBOARD_ENDPOINT_PATH ?? '/dashboard';

/**
 * Infrastructure adapter of the Analytics & Dashboard Bounded Context.
 */
export class AnalyticsDashboardApi extends BaseApi {
  #dashboardEndpoint;

  constructor() {
    super();
    this.#dashboardEndpoint = new BaseEndpoint(this, dashboardEndpointPath);
  }

  /** Weekly savings (Administrator: financial data). */
  getWeeklySavings() { return this.#dashboardEndpoint.getPath('weekly-savings'); }
}
