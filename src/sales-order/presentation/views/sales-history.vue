<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useSalesStore } from '../../application/sales.store.js';
import { SaleStatus } from '../../domain/model/sale.entity.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { useMoney } from '../../../shared/presentation/composables/use-money.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';

/**
 * Sales history view: confirmed and voided sales, the history the demand
 * forecast learns from.
 */
const { t, d } = useI18n();
const toast = useToast();
const { formatMoney } = useMoney();
const confirm = useConfirm();
const salesStore = useSalesStore();

const loading = ref(!salesStore.loaded);

function showError(error, fallback) {
  const { code, params } = toErrorMessage(error, fallback);
  toast.add({ severity: 'error', summary: t(code, params), life: 4000 });
}

onMounted(async () => {
  try {
    await salesStore.loadSales();
  } catch (error) {
    showError(error, 'errors.load');
  } finally {
    loading.value = false;
  }
});

function voidSale(sale) {
  confirm.require({
    header: t('sales.void-title'),
    message: t('sales.void-confirm', { dishes: sale.dishesSummary }),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('common.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('sales.void'), severity: 'danger' },
    accept: async () => {
      try {
        await salesStore.voidSale(sale);
        toast.add({ severity: 'success', summary: t('sales.voided'), life: 2500 });
      } catch (error) {
        showError(error, 'errors.save');
      }
    },
  });
}
</script>

<template>
  <page-header :title="t('sales.title')" :description="t('sales.description')" />

  <div class="grid-stats" role="group" :aria-label="t('sales.summary')">
    <div class="surface-card">
      <p class="stat-label">{{ t('sales.registered') }}</p>
      <p class="stat-value">{{ salesStore.sales.length }}</p>
    </div>
    <div class="surface-card">
      <p class="stat-label">{{ t('sales.revenue') }}</p>
      <p class="stat-value is-success">{{ formatMoney(salesStore.totalRevenue) }}</p>
    </div>
  </div>

  <section class="surface-card" :aria-label="t('sales.table-label')">
    <pv-data-table :value="salesStore.sortedSales" :loading="loading" data-key="id" paginator :rows="10" :aria-label="t('sales.table-label')"
      :row-class="(sale) => (sale.isConfirmed ? '' : 'row-muted')">
      <template #empty><div class="empty-state">{{ t('sales.empty') }}</div></template>
      <pv-column field="saleDate" :header="t('sales.columns.date')" sortable>
        <template #body="{ data }">{{ data.saleDate ? d(new Date(data.saleDate.length === 10 ? `${data.saleDate}T00:00:00` : data.saleDate), 'long') : '—' }}</template>
      </pv-column>
      <pv-column :header="t('sales.columns.channel')">
        <template #body="{ data }">{{ t(`sales.channel.${data.channel}`) }}</template>
      </pv-column>
      <pv-column :header="t('sales.columns.dishes')">
        <template #body="{ data }">{{ data.dishesSummary }}</template>
      </pv-column>
      <pv-column :header="t('sales.columns.total')">
        <template #body="{ data }"><strong>{{ formatMoney(data.total) }}</strong></template>
      </pv-column>
      <pv-column :header="t('sales.columns.status')">
        <template #body="{ data }">
          <pv-tag :value="t(`sales.status.${data.status}`)" :severity="data.status === SaleStatus.VOIDED ? 'danger' : 'success'" />
        </template>
      </pv-column>
      <pv-column :header="t('common.actions')">
        <template #body="{ data }">
          <div class="row-actions">
            <pv-button v-if="data.isConfirmed" icon="pi pi-ban" size="small" text severity="danger" :label="t('sales.void')"
              :aria-label="t('sales.void-sale', { dishes: data.dishesSummary })" @click="voidSale(data)" />
          </div>
        </template>
      </pv-column>
    </pv-data-table>
  </section>
</template>
