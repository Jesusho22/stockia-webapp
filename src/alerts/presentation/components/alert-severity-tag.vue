<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { AlertSeverity } from '../../domain/model/alert.entity.js';

/**
 * Tag with the severity of an alert, written as text and color.
 */
const props = defineProps({ severity: { type: String, required: true } });
const { t } = useI18n();

const tagSeverity = computed(() => ({
  [AlertSeverity.CRITICAL]: 'danger',
  [AlertSeverity.WARNING]: 'warn',
  [AlertSeverity.INFO]: 'info',
}[props.severity] ?? 'secondary'));
</script>

<template>
  <pv-tag :value="t(`alerts.severity.${severity}`)" :severity="tagSeverity" />
</template>
