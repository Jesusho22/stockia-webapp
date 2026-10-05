import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const plansEndpointPath = import.meta.env.VITE_PLANS_ENDPOINT_PATH;
const subscriptionsEndpointPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Subscription & Billing Bounded Context.
 *
 * @remarks
 * The Stripe / PayPal checkout is simulated: no real payment is processed.
 */
export class SubscriptionApi extends BaseApi {
  #plansEndpoint;
  #subscriptionsEndpoint;

  constructor() {
    super();
    this.#plansEndpoint = new BaseEndpoint(this, plansEndpointPath);
    this.#subscriptionsEndpoint = new BaseEndpoint(this, subscriptionsEndpointPath);
  }

  getPlans() { return this.#plansEndpoint.getAll(); }
  getSubscriptions() { return this.#subscriptionsEndpoint.getAll(); }
  /** @param {Object} resource */
  createSubscription(resource) { return this.#subscriptionsEndpoint.create(resource); }
  /** @param {number} id @param {Object} resource complete subscription resource */
  updateSubscription(id, resource) { return this.#subscriptionsEndpoint.update(id, resource); }
}
