import { defineStore } from 'pinia';
import { RestaurantRegistrationApi } from '../infrastructure/restaurant-registration-api.js';
import { RestaurantAssembler } from '../infrastructure/restaurant.assembler.js';
import { Restaurant } from '../domain/model/restaurant.entity.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';
import { toBusinessRuleError } from '../../shared/infrastructure/api-error.js';

const restaurantRegistrationApi = new RestaurantRegistrationApi();

/** API error codes (problem title) → i18n keys of this context. */
const REGISTRATION_ERRORS = {
  EmailAlreadyTaken: 'iam.errors.email-taken',
  RestaurantNotFound: 'settings.restaurant.error',
  Forbidden: 'iam.errors.admin-only',
};

/**
 * Application layer of the Restaurant Registration Bounded Context.
 *
 * @remarks
 * - `register` creates the restaurant with its owner as the first
 *   Administrator and the free plan (Subscription & Payments), then opens the
 *   session through Identity & Access Management.
 * - `updateRestaurant` saves the restaurant data (Administrator only).
 */
export const useRestaurantRegistrationStore = defineStore('restaurant-registration', () => {
  /**
   * @param {{fullName: string, restaurantName: string, email: string, password: string}} form
   * @returns {Promise<import('../../iam/domain/model/user.entity.js').User>}
   */
  async function register({ fullName, restaurantName, email, password }) {
    try {
      const { data } = await restaurantRegistrationApi.register({
        fullName: fullName.trim(), restaurantName: restaurantName.trim(), email: email.trim().toLowerCase(), password,
      });
      return useIamStore().startSession(data);
    } catch (error) {
      throw toBusinessRuleError(error, REGISTRATION_ERRORS);
    }
  }

  /**
   * @param {{restaurantName: string, restaurantAddress: string, restaurantPhone: string}} changes
   * @returns {Promise<Restaurant>}
   */
  async function updateRestaurant({ restaurantName, restaurantAddress, restaurantPhone }) {
    const iamStore = useIamStore();
    if (!iamStore.isAdmin) throw new BusinessRuleError('iam.errors.admin-only');
    const restaurant = new Restaurant({ name: restaurantName, address: restaurantAddress ?? '', phone: restaurantPhone ?? '' });
    try {
      const { data } = await restaurantRegistrationApi.updateCurrentRestaurant(RestaurantAssembler.toResourceFromEntity(restaurant));
      const saved = RestaurantAssembler.toEntityFromResource(data);
      iamStore.applyRestaurant(saved);
      return saved;
    } catch (error) {
      throw toBusinessRuleError(error, REGISTRATION_ERRORS);
    }
  }

  return { register, updateRestaurant };
});
