/**
 * @readonly
 * @enum {string}
 */
export const SubscriptionStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
});

/**
 * Payment provider of the (simulated) checkout.
 *
 * @readonly
 * @enum {string}
 */
export const PaymentMethod = Object.freeze({
  STRIPE: 'STRIPE',
  PAYPAL: 'PAYPAL',
});

const MS_PER_DAY = 86400000;
/** Days covered by one monthly payment. */
export const BILLING_PERIOD_DAYS = 30;

/**
 * @typedef {Object} SubscriptionProps
 * @property {number} [id]
 * @property {number} [planId]
 * @property {string} [status]
 * @property {string} [renewalDate] yyyy-mm-dd
 * @property {string} [paymentMethod]
 */

/**
 * Aggregate root of the Subscription & Billing Bounded Context: the plan the
 * restaurant is subscribed to.
 */
export class Subscription {
  /**
   * @param {SubscriptionProps} [props]
   */
  constructor({ id = 0, planId = 0, status = SubscriptionStatus.ACTIVE, renewalDate = '', paymentMethod = PaymentMethod.STRIPE } = {}) {
    this.id = id;
    this.planId = planId;
    this.status = status;
    this.renewalDate = renewalDate;
    this.paymentMethod = paymentMethod;
  }

  /**
   * Activates a plan paid today; it renews after one billing period.
   *
   * @param {number} planId
   * @param {string} paymentMethod
   * @param {number} [id] keeps the identity of an existing subscription
   * @returns {Subscription}
   */
  static activate(planId, paymentMethod, id = 0) {
    const renewalDate = new Date(Date.now() + BILLING_PERIOD_DAYS * MS_PER_DAY).toISOString().slice(0, 10);
    return new Subscription({ id, planId, paymentMethod, status: SubscriptionStatus.ACTIVE, renewalDate });
  }
}
