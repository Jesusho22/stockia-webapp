<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useAlertsStore } from '../../application/alerts.store.js';
import { AlertChannel, AlertSeverity, AlertType } from '../../domain/model/alert.entity.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { minLength, required, validate } from '../../../shared/presentation/validation.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';
import AlertSeverityTag from '../components/alert-severity-tag.vue';

/**
 * Alerts view: low stock, expiring supplies and equipment faults delivered by
 * WhatsApp and email. Critical alerts must reach both channels before they
 * can be marked as attended.
 */
const { t, d } = useI18n();
const toast = useToast();
const confirm = useConfirm();
const alertsStore = useAlertsStore();

const loading = ref(!alertsStore.alertsLoaded);
const busyId = ref(null);
const dialogVisible = ref(false);
const editing = ref(null);
const submitted = ref(false);
const saving = ref(false);

const emptyForm = () => ({ type: AlertType.LOW_STOCK, severity: AlertSeverity.WARNING, message: '', channel: AlertChannel.WHATSAPP });
const form = reactive(emptyForm());

const typeOptions = computed(() => Object.values(AlertType).map((value) => ({ value, label: t(`alerts.type.${value}`) })));
const severityOptions = computed(() => Object.values(AlertSeverity).map((value) => ({ value, label: t(`alerts.severity.${value}`) })));
const channelOptions = computed(() => Object.values(AlertChannel).map((value) => ({ value, label: t(`alerts.channel.${value}`) })));
const errors = computed(() => (submitted.value ? validate(form, { type: [required], severity: [required], message: [required, minLength(5)], channel: [required] }) : {}));

function showError(error, fallback) {
  const { code, params } = toErrorMessage(error, fallback);
  toast.add({ severity: 'error', summary: t(code, params), life: 4000 });
}

onMounted(async () => {
  try {
    await alertsStore.loadAlerts();
  } catch (error) {
    showError(error, 'errors.load');
  } finally {
    loading.value = false;
  }
});

function openCreate() {
  editing.value = null;
  Object.assign(form, emptyForm());
  submitted.value = false;
  dialogVisible.value = true;
}

function openEdit(alert) {
  editing.value = alert;
  Object.assign(form, { type: alert.type, severity: alert.severity, message: alert.message, channel: alert.channel });
  submitted.value = false;
  dialogVisible.value = true;
}

async function save() {
  submitted.value = true;
  if (Object.keys(errors.value).length > 0) return;
  saving.value = true;
  try {
    if (editing.value) await alertsStore.updateAlert(editing.value, form);
    else await alertsStore.createAlert(form);
    toast.add({ severity: 'success', summary: t(editing.value ? 'alerts.updated' : 'alerts.created'), life: 2500 });
    dialogVisible.value = false;
  } catch (error) {
    showError(error, 'errors.save');
  } finally {
    saving.value = false;
  }
}

async function run(alert, action, successKey) {
  busyId.value = alert.id;
  try {
    const result = await action(alert);
    toast.add({ severity: 'success', summary: t(successKey, { channel: result ? t(`alerts.channel.${result}`) : '' }), life: 2500 });
  } catch (error) {
    showError(error, 'errors.save');
  } finally {
    busyId.value = null;
  }
}

function remove(alert) {
  confirm.require({
    header: t('alerts.delete-title'),
    message: t('alerts.delete-confirm', { message: alert.message }),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('common.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('common.delete'), severity: 'danger' },
    accept: () => run(alert, alertsStore.deleteAlert, 'alerts.deleted'),
  });
}
</script>

<template>
  <page-header :title="t('alerts.title')" :description="t('alerts.description')">
    <template #actions>
      <pv-tag severity="warn" :value="t('alerts.pending', { count: alertsStore.pendingCount }, alertsStore.pendingCount)" />
      <pv-button icon="pi pi-plus" :label="t('alerts.new')" @click="openCreate" />
    </template>
  </page-header>

  <section class="surface-card" :aria-label="t('alerts.table-label')">
    <pv-data-table :value="alertsStore.recentAlerts" :loading="loading" data-key="id" paginator :rows="10" :aria-label="t('alerts.table-label')"
      :row-class="(alert) => (alert.acknowledged ? 'row-muted' : '')">
      <template #empty><div class="empty-state">{{ t('alerts.empty') }}</div></template>
      <pv-column :header="t('alerts.columns.type')">
        <template #body="{ data }">{{ t(`alerts.type.${data.type}`) }}</template>
      </pv-column>
      <pv-column field="message" :header="t('alerts.columns.message')" />
      <pv-column :header="t('alerts.columns.severity')">
        <template #body="{ data }"><alert-severity-tag :severity="data.severity" /></template>
      </pv-column>
      <pv-column :header="t('alerts.columns.delivery')">
        <template #body="{ data }">
          <div class="flex flex-wrap align-items-center gap-2">
            <pv-tag v-if="data.delivered" severity="success"
              :value="t('alerts.delivered', { count: data.requiredChannels.length }, data.requiredChannels.length)" />
            <template v-else>
              <pv-tag severity="warn" :value="t('alerts.missing-channel', { channel: t(`alerts.channel.${data.pendingChannel}`) })" />
              <pv-button size="small" text icon="pi pi-replay" :label="t('alerts.retry')" :loading="busyId === data.id"
                :aria-label="t('alerts.retry-on', { channel: t(`alerts.channel.${data.pendingChannel}`), message: data.message })"
                @click="run(data, alertsStore.retryDelivery, 'alerts.retried')" />
            </template>
          </div>
        </template>
      </pv-column>
      <pv-column field="createdAt" :header="t('alerts.columns.date')">
        <template #body="{ data }">{{ data.createdAt ? d(new Date(data.createdAt), 'short') : '—' }}</template>
      </pv-column>
      <pv-column :header="t('common.actions')">
        <template #body="{ data }">
          <div class="row-actions align-items-center">
            <pv-tag v-if="data.acknowledged" severity="success" :value="t('alerts.attended')" />
            <span v-else v-tooltip.top="data.delivered ? null : t('alerts.errors.not-delivered')">
              <pv-button size="small" outlined icon="pi pi-check" :label="t('alerts.acknowledge')" :disabled="!data.delivered"
                :aria-label="t('alerts.acknowledge-alert', { message: data.message })"
                @click="run(data, alertsStore.acknowledge, 'alerts.acknowledged')" />
            </span>
            <pv-button icon="pi pi-pencil" text rounded :aria-label="t('common.edit-item', { name: data.message })" v-tooltip.top="t('common.edit')" @click="openEdit(data)" />
            <pv-button icon="pi pi-trash" text rounded severity="danger" :aria-label="t('common.delete-item', { name: data.message })" v-tooltip.top="t('common.delete')" @click="remove(data)" />
          </div>
        </template>
      </pv-column>
    </pv-data-table>
  </section>

  <pv-dialog v-model:visible="dialogVisible" modal :header="editing ? t('alerts.edit') : t('alerts.new')" :style="{ width: '34rem' }" :breakpoints="{ '600px': '94vw' }">
    <form id="alert-form" novalidate @submit.prevent="save">
      <div class="form-grid">
        <form-field id="alert-type" :label="t('alerts.fields.type')" :error="errors.type">
          <template #default="{ id, describedBy, invalid }">
            <pv-select v-model="form.type" :input-id="id" :options="typeOptions" option-label="label" option-value="value" :invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
        <form-field id="alert-severity" :label="t('alerts.fields.severity')" :error="errors.severity">
          <template #default="{ id, describedBy, invalid }">
            <pv-select v-model="form.severity" :input-id="id" :options="severityOptions" option-label="label" option-value="value" :invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
      </div>
      <form-field id="alert-message" :label="t('alerts.fields.message')" :error="errors.message">
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="form.message" :placeholder="t('alerts.placeholders.message')" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
      <form-field id="alert-channel" :label="t('alerts.fields.channel')" :error="errors.channel"
        :hint="form.severity === AlertSeverity.CRITICAL ? t('alerts.hints.critical-channels') : ''">
        <template #default="{ id, describedBy, invalid }">
          <pv-select v-model="form.channel" :input-id="id" :options="channelOptions" option-label="label" option-value="value" :invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" outlined @click="dialogVisible = false" />
      <pv-button type="submit" form="alert-form" icon="pi pi-save" :label="editing ? t('common.save-changes') : t('alerts.create')" :loading="saving" />
    </template>
  </pv-dialog>
</template>
