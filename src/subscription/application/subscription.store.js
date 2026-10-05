import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SubscriptionApi } from '../infrastructure/subscription-api.js';
import { PlanAssembler, SubscriptionAssembler } from '../infrastructure/subscription.assembler.js';
import { Plan } from '../domain/model/plan.entity.js';
import { Subscription } from '../domain/model/subscription.entity.js';

const subscriptionApi = new SubscriptionApi();

/**
 * Application layer of the Subscription & Billing Bounded Context.
 */
export const useSubscriptionStore = defineStore('subscription', () => {
  /** @type {import('vue').Ref<Plan[]>} */
  const plans = ref([]);
  /** @type {import('vue').Ref<Subscription|null>} */
  const current = ref(null);
  const loaded = ref(false);

  const currentPlan = computed(() => plans.value.find((plan) => plan.id === current.value?.planId) ?? null);

  async function load() {
    const [plansResponse, subscriptionsResponse] = await Promise.all([subscriptionApi.getPlans(), subscriptionApi.getSubscriptions()]);
    plans.value = PlanAssembler.toEntitiesFromResponse(plansResponse);
    current.value = SubscriptionAssembler.toEntitiesFromResponse(subscriptionsResponse)[0] ?? null;
    loaded.value = true;
  }

  /**
   * Simulated checkout with Stripe or PayPal: creates the subscription or
   * switches the existing one to the chosen plan.
   *
   * @param {Plan} plan
   * @param {string} paymentMethod a PaymentMethod value
   */
  async function choosePlan(plan, paymentMethod) {
    const existing = current.value;
    const subscription = Subscription.activate(plan.id, paymentMethod, existing?.id ?? 0);
    const resource = SubscriptionAssembler.toResourceFromEntity(subscription);
    if (existing) {
      await subscriptionApi.updateSubscription(existing.id, resource);
      current.value = subscription;
    } else {
      delete resource.id;
      const response = await subscriptionApi.createSubscription(resource);
      current.value = SubscriptionAssembler.toEntityFromResource(response.data);
    }
  }

  return { plans, current, loaded, currentPlan, load, choosePlan };
});
