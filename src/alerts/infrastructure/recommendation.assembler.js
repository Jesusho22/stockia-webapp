import { Recommendation } from '../domain/model/recommendation.entity.js';

/**
 * Maps recommendation resources of the API into domain entities and back.
 */
export class RecommendationAssembler {
  /**
   * @param {Object} resource
   * @returns {Recommendation}
   */
  static toEntityFromResource(resource) {
    return new Recommendation({ ...resource });
  }

  /**
   * @param {import('axios').AxiosResponse<Object[]>} response
   * @returns {Recommendation[]}
   */
  static toEntitiesFromResponse(response) {
    return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @param {Recommendation} entity
   * @returns {Object}
   */
  static toResourceFromEntity(entity) {
    return {
      id: entity.id,
      type: entity.type,
      message: entity.message,
      expectedImpact: entity.expectedImpact,
      applied: entity.applied,
    };
  }
}
