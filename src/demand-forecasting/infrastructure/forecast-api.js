import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const demandForecastsEndpointPath = import.meta.env.VITE_DEMAND_FORECASTS_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Demand Forecasting Bounded Context.
 */
export class ForecastApi extends BaseApi {
  #demandForecastsEndpoint;

  constructor() {
    super();
    this.#demandForecastsEndpoint = new BaseEndpoint(this, demandForecastsEndpointPath);
  }

  getDemandForecasts() { return this.#demandForecastsEndpoint.getAll(); }
  /** @param {Object} resource */
  createDemandForecast(resource) { return this.#demandForecastsEndpoint.create(resource); }
}
