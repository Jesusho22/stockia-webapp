import { Alert } from '../domain/model/alert.entity.js';

/**
 * Maps alert resources of the API into domain entities and back.
 */
export class AlertAssembler {
    static toEntityFromResource(resource) {
        return new Alert({ ...resource });
    }

    static toEntitiesFromResponse(response) {
        return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
    }

    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            type: entity.type,
            severity: entity.severity,
            message: entity.message,
            createdAt: entity.createdAt,
            acknowledged: entity.acknowledged,
            channel: entity.channel,
            deliveredChannels: [...entity.deliveredChannels],
        };
    }
}