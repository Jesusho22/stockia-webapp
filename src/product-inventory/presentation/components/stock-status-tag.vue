<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { StockStatus } from '../../domain/model/inventory-item.entity.js';

/**
 * Colored tag with the stock status of an inventory item. The status is
 * always written as text, so color is never the only cue (WCAG 1.4.1).
 */
const props = defineProps({ status: { type: String, required: true } });
const { t } = useI18n();

const severity = computed(() => ({
  [StockStatus.EXPIRED]: 'danger',
  [StockStatus.CRITICAL]: 'danger',
  [StockStatus.LOW]: 'warn',
  [StockStatus.AVAILABLE]: 'success',
}[props.status] ?? 'secondary'));
</script>

<template>
  <pv-tag :value="t(`inventory.status.${status}`)" :severity="severity" />
</template>
