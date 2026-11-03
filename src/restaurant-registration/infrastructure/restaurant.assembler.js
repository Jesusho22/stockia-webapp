import { Restaurant } from '../domain/model/restaurant.entity.js';

/**
 * Maps restaurant resources of the API into domain entities and back.
 */
export class RestaurantAssembler {
  /**
   * @param {{id: number, name: string, address?: string, phone?: string}} resource
   * @returns {Restaurant}
   */
  static toEntityFromResource(resource) {
    return new Restaurant({ id: resource.id, name: resource.name, address: resource.address ?? '', phone: resource.phone ?? '' });
  }

  /**
   * @param {Restaurant} restaurant
   * @returns {{name: string, address: string, phone: string}}
   */
  static toResourceFromEntity(restaurant) {
    return { name: restaurant.name.trim(), address: (restaurant.address ?? '').trim(), phone: (restaurant.phone ?? '').trim() };
  }
}
