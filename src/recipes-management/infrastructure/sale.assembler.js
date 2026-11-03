import { Sale } from '../domain/model/sale.entity.js';

/**
 * Maps sale resources of the API into domain entities and back.
 */
export class SaleAssembler {
  /**
   * @param {Object} resource
   * @returns {Sale}
   */
  static toEntityFromResource(resource) {
    return new Sale({ ...resource, lineItems: resource.lineItems ?? [] });
  }

  /**
   * @param {import('axios').AxiosResponse<Object[]>} response
   * @returns {Sale[]}
   */
  static toEntitiesFromResponse(response) {
    return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @param {Sale} entity
   * @returns {Object}
   */
  static toResourceFromEntity(entity) {
    return {
      id: entity.id,
      saleDate: entity.saleDate,
      channel: entity.channel,
      status: entity.status,
      lineItems: entity.lineItems.map((line) => ({ ...line })),
    };
  }
}
