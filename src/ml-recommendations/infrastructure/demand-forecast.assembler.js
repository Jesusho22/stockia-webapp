import { DemandForecast } from '../domain/model/demand-forecast.entity.js';

/**
 * Maps demand forecast resources of the API into domain entities.
 */
export class DemandForecastAssembler {
  /**
   * @param {Object} resource
   * @returns {DemandForecast}
   */
  static toEntityFromResource(resource) {
    return new DemandForecast({ ...resource, dataPoints: resource.dataPoints ?? [] });
  }

  /**
   * @param {import('axios').AxiosResponse<Object[]>} response
   * @returns {DemandForecast[]}
   */
  static toEntitiesFromResponse(response) {
    return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
