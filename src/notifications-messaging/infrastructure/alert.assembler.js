import { Alert } from '../domain/model/alert.entity.js';

/**
 * Maps alert resources of the API into domain entities and back.
 */
export class AlertAssembler {
  /**
   * @param {Object} resource
   * @returns {Alert}
   */
  static toEntityFromResource(resource) {
    return new Alert({ ...resource });
  }

  /**
   * @param {import('axios').AxiosResponse<Object[]>} response
   * @returns {Alert[]}
   */
  static toEntitiesFromResponse(response) {
    return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @param {Alert} entity
   * @returns {Object}
   */
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
