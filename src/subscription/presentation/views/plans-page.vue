<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useSubscriptionStore } from '../../application/subscription.store.js';
import { PaymentMethod } from '../../domain/model/subscription.entity.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { useMoney } from '../../../shared/presentation/composables/use-money.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';

/**
 * Plans view: choose or change the subscription plan (simulated checkout).
 */
const { t, d } = useI18n();
const toast = useToast();
const { formatMoney } = useMoney();
const subscriptionStore = useSubscriptionStore();

const loading = ref(!subscriptionStore.loaded);
const processing = ref(null);

onMounted(async () => {
  try {
    await subscriptionStore.load();
  } catch (error) {
    toast.add({ severity: 'error', summary: t(toErrorMessage(error, 'errors.load').code), life: 4000 });
  } finally {
    loading.value = false;
  }
});

async function choose(plan, method) {
  processing.value = `${plan.id}-${method}`;
  try {
    await subscriptionStore.choosePlan(plan, method);
    toast.add({ severity: 'success', summary: t('plans.activated', { plan: plan.name }), life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: t(toErrorMessage(error, 'errors.save').code), life: 4000 });
  } finally {
    processing.value = null;
  }
}
</script>

<template>
  <page-header :title="t('plans.title')" :description="t('plans.description')">
    <template #actions>
      <pv-tag v-if="subscriptionStore.currentPlan" severity="success"
        :value="t('plans.active', { plan: subscriptionStore.currentPlan.name })" />
    </template>
  </page-header>

  <p v-if="subscriptionStore.current?.renewalDate" class="mb-4">
    {{ t('plans.renews-on', { date: d(new Date(`${subscriptionStore.current.renewalDate}T00:00:00`), 'date') }) }}
  </p>

  <div v-if="loading" class="flex justify-content-center p-5" role="status" :aria-label="t('common.loading')">
    <pv-progress-spinner style="width: 40px; height: 40px" />
  </div>

  <ul v-else class="plans-grid" :aria-label="t('plans.catalog')">
    <li v-for="plan in subscriptionStore.plans" :key="plan.id">
      <article class="surface-card plan-card" :class="{ 'plan-highlighted': plan.highlighted }" :aria-labelledby="`plan-${plan.id}-name`">
        <pv-tag v-if="plan.highlighted" severity="warn" :value="t('plans.most-popular')" class="plan-tag" />
        <h2 :id="`plan-${plan.id}-name`">{{ plan.name }}</h2>
        <p class="plan-price">
          <span class="amount">{{ formatMoney(plan.monthlyPrice) }}</span>
          <span class="period">{{ t('plans.per-month') }}</span>
        </p>
        <ul class="plan-features">
          <li v-for="feature in plan.features" :key="feature"><i class="pi pi-check" aria-hidden="true" />{{ feature }}</li>
        </ul>
        <pv-tag v-if="subscriptionStore.current?.planId === plan.id" severity="success" :value="t('plans.current')" class="align-self-start mb-2" />
        <div class="plan-actions">
          <pv-button :label="t('plans.pay-with', { provider: 'Stripe' })" icon="pi pi-credit-card"
            :loading="processing === `${plan.id}-${PaymentMethod.STRIPE}`" :disabled="processing !== null"
            :aria-label="t('plans.pay-plan-with', { plan: plan.name, provider: 'Stripe' })" @click="choose(plan, PaymentMethod.STRIPE)" />
          <pv-button :label="t('plans.pay-with', { provider: 'PayPal' })" icon="pi pi-paypal" severity="secondary" outlined
            :loading="processing === `${plan.id}-${PaymentMethod.PAYPAL}`" :disabled="processing !== null"
            :aria-label="t('plans.pay-plan-with', { plan: plan.name, provider: 'PayPal' })" @click="choose(plan, PaymentMethod.PAYPAL)" />
        </div>
      </article>
    </li>
  </ul>
  <p class="form-hint mt-3">{{ t('plans.simulated-note') }}</p>
</template>

<style scoped>
.plans-grid {
  list-style: none;
  margin: 0;
  padding: .75rem 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}
.plan-card { position: relative; display: flex; flex-direction: column; height: 100%; }
.plan-highlighted { border-color: var(--color-accent); box-shadow: var(--shadow-md); }
.plan-tag { position: absolute; top: -12px; right: 1rem; }
.plan-price { margin: .25rem 0 1rem; }
.plan-price .amount { font-size: 2rem; font-weight: 800; color: var(--color-primary-dark); }
.plan-price .period { color: var(--color-muted); margin-left: .25rem; }
.plan-features { list-style: none; padding: 0; margin: 0 0 1.25rem; display: flex; flex-direction: column; gap: .5rem; flex: 1; }
.plan-features li { font-size: .9rem; color: var(--color-text); display: flex; gap: .5rem; align-items: baseline; }
.plan-features .pi { color: var(--color-success); font-size: .8rem; }
.plan-actions { display: flex; flex-direction: column; gap: .5rem; }
</style>
