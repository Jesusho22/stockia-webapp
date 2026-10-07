import { InventoryItem } from '../domain/model/inventory-item.entity.js';
import { DecimalQuantity } from '../../shared/domain/model/decimal-quantity.js';

/**
 * Maps inventory item resources of the API into domain entities and back.
 * Quantities travel as JSON numbers when they are exact, and as strings when
 * they have more digits than a number can hold (up to 32 decimals).
 */
export class InventoryItemAssembler {
  /**
   * @param {Object} resource
   * @returns {InventoryItem}
   */
  static toEntityFromResource(resource) {
    return new InventoryItem({ ...resource });
  }

  /**
   * @param {import('axios').AxiosResponse<Object[]>} response
   * @returns {InventoryItem[]}
   */
  static toEntitiesFromResponse(response) {
    return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @param {InventoryItem} entity
   * @returns {Object}
   */
  static toResourceFromEntity(entity) {
    return {
      id: entity.id,
      name: entity.name,
      unit: entity.unit,
      quantity: DecimalQuantity.toApi(entity.quantity),
      minThreshold: DecimalQuantity.toApi(entity.minThreshold),
      storageType: entity.storageType,
      shelfLifeDays: entity.shelfLifeDays,
      expirationDate: entity.expirationDate,
      unitCost: entity.unitCost,
    };
  }
}
