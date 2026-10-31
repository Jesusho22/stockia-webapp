<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useIamStore } from '../../../iam/application/iam.store.js';
import { useStockManagementStore } from '../../../stock-management/application/stock-management.store.js';
import { useAlertsStore } from '../../../notifications-messaging/application/alerts.store.js';
import { useForecastStore } from '../../../ml-recommendations/application/forecast.store.js';
import { useAnalyticsDashboardStore } from '../../application/analytics-dashboard.store.js';
import { useMoney } from '../../../shared/presentation/composables/use-money.js';
import { useQuantity } from '../../../shared/presentation/composables/use-quantity.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';
import StockStatusTag from '../../../stock-management/presentation/components/stock-status-tag.vue';
import AlertSeverityTag from '../../../notifications-messaging/presentation/components/alert-severity-tag.vue';
import ForecastChart from '../../../ml-recommendations/presentation/components/forecast-chart.vue';
import WeeklySavingsCard from '../components/weekly-savings-card.vue';

/**
 * Analytics & Dashboard view: operational summary that composes the
 * application stores of Stock Management, Notifications & Messaging and
 * ML & Recommendations (it never calls their infrastructure directly), plus
 * the weekly savings for the Administrator (an Employee sees no financial
 * metrics).
 */
const { t } = useI18n();
const toast = useToast();
const { formatMoney } = useMoney();
const { formatQuantity } = useQuantity();
const iamStore = useIamStore();
const stockStore = useStockManagementStore();
const alertsStore = useAlertsStore();
const forecastStore = useForecastStore();
const analyticsStore = useAnalyticsDashboardStore();

const loading = ref(true);
const user = computed(() => iamStore.currentUser);
const latestAlerts = computed(() => alertsStore.recentAlerts.slice(0, 5));

onMounted(async () => {
  const loads = [stockStore.loadItems(), alertsStore.loadAlerts(), forecastStore.loadForecasts()];
  if (iamStore.isAdmin) loads.push(analyticsStore.loadWeeklySavings());
  const results = await Promise.allSettled(loads);
  if (results.some((result) => result.status === 'rejected')) toast.add({ severity: 'error', summary: t('errors.load'), life: 4000 });
  loading.value = false;
});
</script>

<template>
  <page-header
    :title="t('dashboard.greeting', { name: user?.fullName || t('dashboard.team') })"
    :description="t('dashboard.description', { restaurant: user?.restaurantName || t('dashboard.your-restaurant') })"
  />

  <div class="grid-stats" role="group" :aria-label="t('dashboard.indicators')" :aria-busy="loading">
    <div class="surface-card">
      <p class="stat-label">{{ t('dashboard.registered-items') }}</p>
      <p class="stat-value">{{ stockStore.items.length }}</p>
    </div>
    <div class="surface-card">
      <p class="stat-label">{{ t('dashboard.low-critical') }}</p>
      <p class="stat-value is-danger">{{ stockStore.attentionCount }}</p>
    </div>
    <div class="surface-card">
      <p class="stat-label">{{ t('dashboard.expiring-soon') }}</p>
      <p class="stat-value is-warning">{{ stockStore.expiringSoonCount }}</p>
    </div>
    <div class="surface-card">
      <p class="stat-label">{{ t('dashboard.inventory-value') }}</p>
      <p class="stat-value">{{ formatMoney(stockStore.inventoryValue) }}</p>
    </div>
  </div>

  <weekly-savings-card v-if="iamStore.isAdmin && analyticsStore.weeklySavings" :savings="analyticsStore.weeklySavings" class="mb-4" />

  <div class="dashboard-grid">
    <section class="surface-card" aria-labelledby="critical-items-title">
      <h2 id="critical-items-title">{{ t('dashboard.critical-items') }}</h2>
      <pv-data-table :value="stockStore.itemsNeedingAttention" :loading="loading" data-key="id" size="small" :aria-label="t('dashboard.critical-items')">
        <template #empty><div class="empty-state">{{ t('dashboard.no-critical-items') }}</div></template>
        <pv-column field="name" :header="t('inventory.columns.item')" />
        <pv-column :header="t('inventory.columns.quantity')">
          <template #body="{ data }">{{ formatQuantity(data.quantity, data.unit) }}</template>
        </pv-column>
        <pv-column :header="t('inventory.columns.status')">
          <template #body="{ data }"><stock-status-tag :status="data.status" /></template>
        </pv-column>
      </pv-data-table>
    </section>

    <section class="surface-card" aria-labelledby="recent-alerts-title">
      <h2 id="recent-alerts-title">{{ t('dashboard.recent-alerts') }}</h2>
      <div v-if="!loading && latestAlerts.length === 0" class="empty-state">{{ t('dashboard.no-alerts') }}</div>
      <ul v-else class="alert-feed">
        <li v-for="alert in latestAlerts" :key="alert.id">
          <alert-severity-tag :severity="alert.severity" />
          <span>{{ alert.message }}</span>
        </li>
      </ul>
      <router-link to="/app/alerts" class="see-all">{{ t('dashboard.see-all-alerts') }}</router-link>
    </section>
  </div>

  <section v-if="forecastStore.latest" class="surface-card mt-4" aria-labelledby="forecast-title">
    <h2 id="forecast-title">{{ t('dashboard.projected-demand') }}</h2>
    <forecast-chart :forecast="forecastStore.latest" :height="70" compact />
  </section>
</template>

<style scoped>
.dashboard-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 1.5rem; }
.alert-feed { list-style: none; padding: 0; margin: 0 0 1rem; display: flex; flex-direction: column; gap: .75rem; }
.alert-feed li { font-size: .9rem; display: flex; align-items: center; gap: .6rem; }
.see-all { color: var(--color-accent-strong); font-weight: 600; font-size: .9rem; }

@media (max-width: 900px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
</style>
