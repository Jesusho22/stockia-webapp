import { DemandForecast } from '../domain/model/demand-forecast.entity.js';

/**
 * Maps demand forecast resources of the API into domain entities and back.
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

  /**
   * @param {DemandForecast} entity
   * @returns {Object}
   */
  static toResourceFromEntity(entity) {
    return {
      id: entity.id,
      generatedAt: entity.generatedAt,
      confidenceScore: entity.confidenceScore,
      weatherCondition: entity.weatherCondition,
      dataPoints: entity.dataPoints.map((point) => ({ ...point })),
    };
  }
}
