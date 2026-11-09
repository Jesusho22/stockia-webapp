import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SubscriptionApi } from '../infrastructure/subscription-api.js';
import { PlanAssembler, SubscriptionAssembler } from '../infrastructure/subscription.assembler.js';
import { Plan } from '../domain/model/plan.entity.js';

const subscriptionApi = new SubscriptionApi();

/**
 * Application layer of the Subscription & Payments Bounded Context.
 */
export const useSubscriptionStore = defineStore('subscription', () => {
  /** @type {import('vue').Ref<Plan[]>} */
  const plans = ref([]);
  /** @type {import('vue').Ref<Subscription|null>} */
  const current = ref(null);
  const loaded = ref(false);

  const currentPlan = computed(() => plans.value.find((plan) => plan.id === current.value?.planId) ?? null);

  async function load() {
    const [plansResponse, subscriptionResponse] = await Promise.all([
      subscriptionApi.getPlans(),
      subscriptionApi.getCurrentSubscription().catch((error) => (error?.response?.status === 404 ? { data: null } : Promise.reject(error))),
    ]);
    plans.value = PlanAssembler.toEntitiesFromResponse(plansResponse);
    current.value = subscriptionResponse.data ? SubscriptionAssembler.toEntityFromResource(subscriptionResponse.data) : null;
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
    const { data } = await subscriptionApi.choosePlan({ planId: plan.id, paymentMethod });
    current.value = SubscriptionAssembler.toEntityFromResource(data);
  }

  return { plans, current, loaded, currentPlan, load, choosePlan };
});
