<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMoney } from '../../../shared/presentation/composables/use-money.js';
import { useQuantity } from '../../../shared/presentation/composables/use-quantity.js';

/**
 * Weekly savings (Weekly Savings Calculator): stock used before it expired
 * and the change of the waste against the previous week.
 */
const props = defineProps({
  /** @type {import('vue').PropType<import('../../domain/model/weekly-savings.entity.js').WeeklySavings>} */
  savings: { type: Object, required: true },
});

const { t } = useI18n();
const { formatMoney } = useMoney();
const { formatQuantity } = useQuantity();

const wasteTrend = computed(() => {
  if (props.savings.wasteReduction > 0) return { label: t('savings.waste-down', { amount: formatMoney(props.savings.wasteReduction) }), css: 'is-success' };
  if (props.savings.wasteReduction < 0) return { label: t('savings.waste-up', { amount: formatMoney(-props.savings.wasteReduction) }), css: 'is-danger' };
  return { label: t('savings.waste-same'), css: '' };
});
</script>

<template>
  <section class="surface-card savings-card" aria-labelledby="weekly-savings-title" data-testid="weekly-savings">
    <header class="savings-header">
      <h2 id="weekly-savings-title">{{ t('savings.title') }}</h2>
      <span class="savings-period">{{ t('savings.period', { from: savings.from, to: savings.to }) }}</span>
    </header>

    <div class="savings-grid">
      <div>
        <p class="stat-label">{{ t('savings.estimated') }}</p>
        <p class="stat-value is-success" data-testid="estimated-savings">{{ formatMoney(savings.estimatedSavings) }}</p>
        <p class="savings-note">{{ t('savings.estimated-note') }}</p>
      </div>
      <div>
        <p class="stat-label">{{ t('savings.rescued') }}</p>
        <p class="stat-value">{{ formatMoney(savings.rescuedValue) }}</p>
        <p class="savings-note">{{ t('savings.rescued-note') }}</p>
      </div>
      <div>
        <p class="stat-label">{{ t('savings.waste') }}</p>
        <p class="stat-value is-danger">{{ formatMoney(savings.wasteValue) }}</p>
        <p class="savings-note" :class="wasteTrend.css">{{ wasteTrend.label }}</p>
      </div>
      <div>
        <p class="stat-label">{{ t('savings.sales') }}</p>
        <p class="stat-value">{{ formatMoney(savings.revenue) }}</p>
        <p class="savings-note">{{ t('savings.portions', { count: savings.portionsSold }, savings.portionsSold) }}</p>
      </div>
    </div>

    <div class="savings-lists">
      <div>
        <h3>{{ t('savings.top-rescued') }}</h3>
        <p v-if="savings.topRescued.length === 0" class="savings-note">{{ t('savings.none-rescued') }}</p>
        <ul v-else>
          <li v-for="line in savings.topRescued" :key="`r-${line.itemName}-${line.unit}`">
            <span>{{ line.itemName }} · {{ formatQuantity(line.quantity, line.unit) }}</span><strong>{{ formatMoney(line.value) }}</strong>
          </li>
        </ul>
      </div>
      <div>
        <h3>{{ t('savings.wasted') }}</h3>
        <p v-if="savings.wasted.length === 0" class="savings-note">{{ t('savings.none-wasted') }}</p>
        <ul v-else>
          <li v-for="line in savings.wasted" :key="`w-${line.itemName}-${line.unit}`">
            <span>{{ line.itemName }} · {{ formatQuantity(line.quantity, line.unit) }}</span><strong>{{ formatMoney(line.value) }}</strong>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.savings-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: .5rem; }
.savings-header h2 { margin: 0; }
.savings-period { font-size: .85rem; color: var(--color-text-muted, #64748b); }
.savings-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin: 1rem 0; }
.savings-note { font-size: .8rem; margin: .25rem 0 0; }
.savings-note.is-success { color: var(--color-success, #15803d); }
.savings-note.is-danger { color: var(--color-danger, #b91c1c); }
.savings-lists { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.savings-lists h3 { font-size: .95rem; margin: 0 0 .5rem; }
.savings-lists ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .4rem; }
.savings-lists li { display: flex; justify-content: space-between; gap: .75rem; font-size: .9rem; }

@media (max-width: 900px) {
  .savings-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .savings-lists { grid-template-columns: 1fr; }
}
</style>
