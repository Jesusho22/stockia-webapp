import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const plansEndpointPath = import.meta.env.VITE_PLANS_ENDPOINT_PATH;
const subscriptionsEndpointPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the Subscription & Payments Bounded Context.
 *
 * @remarks
 * The Stripe / PayPal checkout is simulated by the API (SimulatedPaymentGateway):
 * no real payment is processed.
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

  /** Subscription of the signed-in restaurant (Administrator only). */
  getCurrentSubscription() { return this.#subscriptionsEndpoint.getPath('current'); }

  /** @param {{planId: number, paymentMethod: string}} choice simulated Stripe / PayPal checkout */
  choosePlan(choice) { return this.#subscriptionsEndpoint.create(choice); }
}
