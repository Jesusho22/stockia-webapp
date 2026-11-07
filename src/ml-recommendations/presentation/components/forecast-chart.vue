<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * Bar chart of projected units per day. Every bar keeps its value, day and
 * dish as visible text, so the chart is readable without seeing the bars.
 */
const props = defineProps({
  /** @type {import('vue').PropType<import('../../domain/model/demand-forecast.entity.js').DemandForecast>} */
  forecast: { type: Object, required: true },
  /** Maximum bar height in pixels. */
  height: { type: Number, default: 160 },
  compact: { type: Boolean, default: false },
});

const { t, d } = useI18n();

const bars = computed(() => props.forecast.dataPoints.map((point) => ({
  ...point,
  day: d(new Date(`${point.date}T00:00:00`), 'weekday'),
  barHeight: `${Math.max(6, (point.projectedUnits / props.forecast.maxProjectedUnits) * props.height)}px`,
})));
</script>

<template>
  <ul class="chart" :class="{ compact }" :style="{ minHeight: `${height + (compact ? 30 : 70)}px` }" :aria-label="t('forecast.chart-label')">
    <li v-for="bar in bars" :key="bar.date" class="chart-col">
      <span class="chart-value">{{ bar.projectedUnits }}<span class="sr-only"> {{ t('forecast.units') }}</span></span>
      <span class="chart-bar" :style="{ height: bar.barHeight }" aria-hidden="true" />
      <span class="chart-label">{{ bar.day }}</span>
      <span v-if="!compact" class="chart-dish">{{ bar.dishName }}</span>
    </li>
  </ul>
</template>

<style scoped>
.chart { list-style: none; margin: 0; padding: 1rem 0 0; display: flex; align-items: flex-end; gap: 1rem; }
.chart-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: .35rem; min-width: 0; }
.chart-value { font-size: .8rem; font-weight: 700; color: var(--color-primary-dark); }
.chart-bar {
  width: 100%;
  max-width: 48px;
  background: linear-gradient(180deg, var(--color-accent), var(--color-accent-strong));
  border-radius: 6px 6px 2px 2px;
}
.chart-label { font-size: .8rem; font-weight: 700; color: var(--color-text); text-transform: capitalize; }
.chart-dish { font-size: .7rem; color: var(--color-muted); text-align: center; }
.compact { gap: .6rem; }
.compact .chart-bar { max-width: 28px; background: var(--color-primary-light); }
.compact .chart-value { font-size: .7rem; }
</style>
