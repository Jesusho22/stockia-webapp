import { defineStore } from 'pinia';
import { ref } from 'vue';
import { AnalyticsDashboardApi } from '../infrastructure/analytics-dashboard-api.js';
import { WeeklySavingsAssembler } from '../infrastructure/weekly-savings.assembler.js';

const analyticsDashboardApi = new AnalyticsDashboardApi();

/**
 * Application layer of the Analytics & Dashboard Bounded Context. The KPIs
 * of the dashboard come from the stores of the other contexts; the weekly
 * savings are calculated by the API (Administrator only).
 */
export const useAnalyticsDashboardStore = defineStore('analytics-dashboard', () => {
  /** @type {import('vue').Ref<import('../domain/model/weekly-savings.entity.js').WeeklySavings|null>} */
  const weeklySavings = ref(null);

  async function loadWeeklySavings() {
    const { data } = await analyticsDashboardApi.getWeeklySavings();
    weeklySavings.value = WeeklySavingsAssembler.toEntityFromResource(data);
  }

  return { weeklySavings, loadWeeklySavings };
});
