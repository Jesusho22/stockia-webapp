<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSubscriptionStore } from '../../application/subscription.store.js';
import { useMoney } from '../../../shared/presentation/composables/use-money.js';

/**
 * Account settings › Subscription type: current plan, price, status, renewal
 * date and payment method, with a link to "Upgrade plan".
 *
 * @remarks
 * Only the Administrator sees this card (the Employee cannot see the
 * subscription type); the parent view decides whether to render it.
 */
const { t, d } = useI18n();
const { formatMoney } = useMoney();
const subscriptionStore = useSubscriptionStore();

const loading = ref(!subscriptionStore.loaded);
const failed = ref(false);

onMounted(async () => {
  try {
    await subscriptionStore.load();
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="surface-card settings-card" aria-labelledby="settings-subscription-title">
    <header class="settings-card-header">
      <span class="settings-icon" aria-hidden="true"><i class="pi pi-credit-card" /></span>
      <div>
        <h2 id="settings-subscription-title">{{ t('settings.subscription.title') }}</h2>
        <p>{{ t('settings.subscription.description') }}</p>
      </div>
    </header>

    <p v-if="loading" role="status">{{ t('common.loading') }}</p>
    <p v-else-if="failed" class="form-error" role="alert">{{ t('errors.load') }}</p>
    <template v-else>
      <dl class="data-list">
        <div>
          <dt>{{ t('settings.subscription.plan') }}</dt>
          <dd><strong>{{ subscriptionStore.currentPlan?.name ?? t('settings.subscription.none') }}</strong></dd>
        </div>
        <div v-if="subscriptionStore.currentPlan">
          <dt>{{ t('settings.subscription.price') }}</dt>
          <dd>{{ formatMoney(subscriptionStore.currentPlan.monthlyPrice) }} {{ t('plans.per-month') }}</dd>
        </div>
        <div v-if="subscriptionStore.current">
          <dt>{{ t('settings.subscription.status') }}</dt>
          <dd><pv-tag :severity="subscriptionStore.current.status === 'ACTIVE' ? 'success' : 'warn'" :value="t(`settings.subscription.statuses.${subscriptionStore.current.status}`)" /></dd>
        </div>
        <div v-if="subscriptionStore.current?.renewalDate">
          <dt>{{ t('settings.subscription.renewal') }}</dt>
          <dd>{{ d(new Date(`${subscriptionStore.current.renewalDate}T00:00:00`), 'date') }}</dd>
        </div>
        <div v-if="subscriptionStore.current">
          <dt>{{ t('settings.subscription.payment') }}</dt>
          <dd>{{ subscriptionStore.current.paymentMethod === 'PAYPAL' ? 'PayPal' : 'Stripe' }}</dd>
        </div>
      </dl>
      <router-link to="/app/settings/plans" class="p-button p-component p-button-outlined upgrade-link">
        <i class="pi pi-star" aria-hidden="true" />
        <span>{{ t('nav.settings-plans') }}</span>
      </router-link>
    </template>
  </section>
</template>

<style scoped>
.upgrade-link { display: inline-flex; gap: .5rem; text-decoration: none; margin-top: .5rem; }
</style>
