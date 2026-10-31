import { WeeklySavings } from '../domain/model/weekly-savings.entity.js';

/**
 * Maps the weekly savings resource of the API into a domain object.
 */
export class WeeklySavingsAssembler {
  /**
   * @param {Object} resource
   * @returns {WeeklySavings}
   */
  static toEntityFromResource(resource) {
    const lines = (list) => (list ?? []).map((line) => ({ ...line, quantity: Number(line.quantity), value: Number(line.value) }));
    return new WeeklySavings({ ...resource, topRescued: lines(resource.topRescued), wasted: lines(resource.wasted) });
  }
}
