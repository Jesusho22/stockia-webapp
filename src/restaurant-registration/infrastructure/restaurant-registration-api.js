import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const restaurantRegistrationsEndpointPath = import.meta.env.VITE_RESTAURANT_REGISTRATIONS_ENDPOINT_PATH ?? '/restaurant-registrations';
const restaurantsEndpointPath = import.meta.env.VITE_RESTAURANTS_ENDPOINT_PATH ?? '/restaurants';

/**
 * Infrastructure adapter of the Restaurant Registration Bounded Context:
 * the onboarding of a new restaurant (Restaurant Onboarding Controller) and
 * the restaurant data (Profile Management Component).
 */
export class RestaurantRegistrationApi extends BaseApi {
  #registrationsEndpoint;
  #restaurantsEndpoint;

  constructor() {
    super();
    this.#registrationsEndpoint = new BaseEndpoint(this, restaurantRegistrationsEndpointPath);
    this.#restaurantsEndpoint = new BaseEndpoint(this, restaurantsEndpointPath);
  }

  /**
   * Registers the restaurant, its owner (first Administrator) and the free
   * plan; answers the signed-in owner with a JWT.
   *
   * @param {{fullName: string, restaurantName: string, email: string, password: string}} form
   */
  register(form) { return this.#registrationsEndpoint.create(form); }

  getCurrentRestaurant() { return this.#restaurantsEndpoint.getPath('current'); }

  /** @param {{name: string, address: string, phone: string}} restaurant */
  updateCurrentRestaurant(restaurant) { return this.#restaurantsEndpoint.put('current', restaurant); }
}
