<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useForecastStore } from '../../application/forecast.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';
import ForecastChart from '../components/forecast-chart.vue';

/**
 * Demand forecast view: projection of units per dish for the next seven days.
 */
const { t, d, n, te } = useI18n();
const toast = useToast();
const forecastStore = useForecastStore();

const loading = ref(!forecastStore.loaded);
const generating = ref(false);
const latest = computed(() => forecastStore.latest);

/** Weather values stored by the API (Spanish) mapped to i18n keys. */
const WEATHER_KEYS = { Soleado: 'sunny', Nublado: 'cloudy', 'Lluvia ligera': 'light-rain' };
const weatherLabel = computed(() => {
  const key = `forecast.weather.${WEATHER_KEYS[latest.value?.weatherCondition] ?? ''}`;
  return te(key) ? t(key) : latest.value?.weatherCondition;
});

onMounted(async () => {
  try {
    await forecastStore.loadForecasts();
  } catch (error) {
    toast.add({ severity: 'error', summary: t(toErrorMessage(error, 'errors.load').code), life: 4000 });
  } finally {
    loading.value = false;
  }
});

async function generate() {
  generating.value = true;
  try {
    await forecastStore.generate();
    toast.add({ severity: 'success', summary: t('forecast.generated'), life: 2500 });
  } catch (error) {
    toast.add({ severity: 'error', summary: t(toErrorMessage(error, 'errors.save').code), life: 4000 });
  } finally {
    generating.value = false;
  }
}
</script>

<template>
  <page-header :title="t('forecast.title')" :description="t('forecast.description')">
    <template #actions>
      <pv-button icon="pi pi-bolt" :label="generating ? t('forecast.generating') : t('forecast.generate')" :loading="generating" @click="generate" />
    </template>
  </page-header>

  <div v-if="loading" class="surface-card flex justify-content-center p-5" role="status" :aria-label="t('common.loading')">
    <pv-progress-spinner style="width: 40px; height: 40px" />
  </div>

  <div v-else-if="!latest" class="surface-card"><div class="empty-state">{{ t('forecast.empty') }}</div></div>

  <template v-else>
    <div class="grid-stats" role="group" :aria-label="t('forecast.summary')">
      <div class="surface-card">
        <p class="stat-label">{{ t('forecast.confidence') }}</p>
        <p class="stat-value">{{ n(latest.confidenceScore, 'percent') }}</p>
      </div>
      <div class="surface-card">
        <p class="stat-label">{{ t('forecast.weather-label') }}</p>
        <p class="stat-value">{{ weatherLabel }}</p>
      </div>
      <div class="surface-card">
        <p class="stat-label">{{ t('forecast.generated-at') }}</p>
        <p class="stat-value stat-small">{{ d(new Date(latest.generatedAt), 'long') }}</p>
      </div>
    </div>

    <section class="surface-card" aria-labelledby="forecast-chart-title">
      <h2 id="forecast-chart-title">{{ t('forecast.units-per-day') }}</h2>
      <forecast-chart :forecast="latest" />
    </section>
  </template>
</template>

<style scoped>
.stat-small { font-size: 1.05rem; }
</style>
