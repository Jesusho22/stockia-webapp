import { Plan } from '../domain/model/plan.entity.js';
import { Subscription } from '../domain/model/subscription.entity.js';

/**
 * Maps plan resources of the API into domain entities.
 */
export class PlanAssembler {
  /** @param {Object} resource @returns {Plan} */
  static toEntityFromResource(resource) {
    return new Plan({ ...resource, features: resource.features ?? [] });
  }

  /** @param {import('axios').AxiosResponse<Object[]>} response @returns {Plan[]} */
  static toEntitiesFromResponse(response) {
    return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}

/**
 * Maps subscription resources of the API into domain entities and back.
 */
export class SubscriptionAssembler {
  /** @param {Object} resource @returns {Subscription} */
  static toEntityFromResource(resource) {
    return new Subscription({ ...resource });
  }

  /** @param {import('axios').AxiosResponse<Object[]>} response @returns {Subscription[]} */
  static toEntitiesFromResponse(response) {
    return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
  }

  /** @param {Subscription} entity @returns {Object} */
  static toResourceFromEntity(entity) {
    return {
      id: entity.id,
      planId: entity.planId,
      status: entity.status,
      renewalDate: entity.renewalDate,
      paymentMethod: entity.paymentMethod,
    };
  }
}
