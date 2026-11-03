import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const dashboardEndpointPath = import.meta.env.VITE_DASHBOARD_ENDPOINT_PATH ?? '/dashboard';

export class AnalyticsDashboardApi extends BaseApi {
    #dashboardEndpoint;

    constructor() {
        super();
        this.#dashboardEndpoint = new BaseEndpoint(this, dashboardEndpointPath);
    }

    getWeeklySavings() { return this.#dashboardEndpoint.getPath('weekly-savings'); }
}