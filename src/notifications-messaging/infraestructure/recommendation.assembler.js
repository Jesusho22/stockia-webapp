import { Recommendation } from '../domain/model/recommendation.entity.js';

/**
 * Maps recommendation resources of the API into domain entities and back.
 */
export class RecommendationAssembler {
    static toEntityFromResource(resource) {
        return new Recommendation({ ...resource });
    }

    static toEntitiesFromResponse(response) {
        return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
    }

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