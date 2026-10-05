<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useAlertsStore } from '../../application/alerts.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';

/**
 * Recommendations view: automatic menu and purchase suggestions based on
 * popularity and seasonality.
 */
const { t } = useI18n();
const toast = useToast();
const alertsStore = useAlertsStore();

const loading = ref(!alertsStore.recommendationsLoaded);
const applyingId = ref(null);

onMounted(async () => {
  try {
    await alertsStore.loadRecommendations();
  } catch (error) {
    toast.add({ severity: 'error', summary: t(toErrorMessage(error, 'errors.load').code), life: 4000 });
  } finally {
    loading.value = false;
  }
});

async function apply(recommendation) {
  applyingId.value = recommendation.id;
  try {
    await alertsStore.applyRecommendation(recommendation);
    toast.add({ severity: 'success', summary: t('recommendations.applied-toast'), life: 2500 });
  } catch (error) {
    toast.add({ severity: 'error', summary: t(toErrorMessage(error, 'errors.save').code), life: 4000 });
  } finally {
    applyingId.value = null;
  }
}
</script>

<template>
  <page-header :title="t('recommendations.title')" :description="t('recommendations.description')" />

  <section class="surface-card" :aria-label="t('recommendations.table-label')">
    <pv-data-table :value="alertsStore.recommendations" :loading="loading" data-key="id" :aria-label="t('recommendations.table-label')"
      :row-class="(rec) => (rec.applied ? 'row-muted' : '')">
      <template #empty><div class="empty-state">{{ t('recommendations.empty') }}</div></template>
      <pv-column :header="t('recommendations.columns.type')">
        <template #body="{ data }">{{ t(`recommendations.type.${data.type}`) }}</template>
      </pv-column>
      <pv-column field="message" :header="t('recommendations.columns.recommendation')" />
      <pv-column field="expectedImpact" :header="t('recommendations.columns.impact')" />
      <pv-column :header="t('common.actions')">
        <template #body="{ data }">
          <div class="row-actions">
            <pv-tag v-if="data.applied" severity="success" :value="t('recommendations.applied')" />
            <pv-button v-else size="small" icon="pi pi-check" outlined :label="t('recommendations.apply')" :loading="applyingId === data.id"
              :aria-label="t('recommendations.apply-item', { message: data.message })" @click="apply(data)" />
          </div>
        </template>
      </pv-column>
    </pv-data-table>
  </section>
</template>
