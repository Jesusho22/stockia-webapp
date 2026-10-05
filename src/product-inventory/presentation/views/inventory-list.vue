<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useInventoryStore } from '../../application/inventory.store.js';
import { StorageType } from '../../domain/model/inventory-item.entity.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { minValue, required, validate } from '../../../shared/presentation/validation.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';
import StockStatusTag from '../components/stock-status-tag.vue';

/**
 * Inventory view: register, edit and delete the supplies of the restaurant.
 */
const { t, d, n } = useI18n();
const toast = useToast();
const confirm = useConfirm();
const inventoryStore = useInventoryStore();

const loading = ref(!inventoryStore.itemsLoaded);
const dialogVisible = ref(false);
const editingId = ref(null);
const submitted = ref(false);
const saving = ref(false);

const emptyForm = () => ({ name: '', unit: 'kg', quantity: 0, minThreshold: 5, storageType: StorageType.AMBIENT, shelfLifeDays: 7, unitCost: 0 });
const form = reactive(emptyForm());

const storageOptions = computed(() => Object.values(StorageType).map((value) => ({ value, label: t(`inventory.storage.${value}`) })));
const errors = computed(() => (submitted.value
  ? validate(form, {
    name: [required], unit: [required], quantity: [minValue(0)], minThreshold: [minValue(0)],
    storageType: [required], shelfLifeDays: [minValue(1)], unitCost: [minValue(0)],
  })
  : {}));

function showError(error, fallback) {
  const { code, params } = toErrorMessage(error, fallback);
  toast.add({ severity: 'error', summary: t(code, params), life: 4000 });
}

onMounted(async () => {
  try {
    await inventoryStore.loadItems();
  } catch (error) {
    showError(error, 'errors.load');
  } finally {
    loading.value = false;
  }
});

function openCreate() {
  editingId.value = null;
  Object.assign(form, emptyForm());
  submitted.value = false;
  dialogVisible.value = true;
}

/** @param {import('../../domain/model/inventory-item.entity.js').InventoryItem} item */
function openEdit(item) {
  editingId.value = item.id;
  Object.assign(form, {
    name: item.name, unit: item.unit, quantity: item.quantity, minThreshold: item.minThreshold,
    storageType: item.storageType, shelfLifeDays: item.shelfLifeDays, unitCost: item.unitCost,
  });
  submitted.value = false;
  dialogVisible.value = true;
}

async function save() {
  submitted.value = true;
  if (Object.keys(errors.value).length > 0) return;
  saving.value = true;
  try {
    await inventoryStore.saveItem({ ...form }, editingId.value);
    dialogVisible.value = false;
    toast.add({ severity: 'success', summary: t(editingId.value ? 'inventory.updated' : 'inventory.created', { name: form.name }), life: 2500 });
  } catch (error) {
    showError(error, 'errors.save');
  } finally {
    saving.value = false;
  }
}

function remove(item) {
  confirm.require({
    header: t('inventory.delete-title'),
    message: t('inventory.delete-confirm', { name: item.name }),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('common.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('common.delete'), severity: 'danger' },
    accept: async () => {
      try {
        await inventoryStore.deleteItem(item);
        toast.add({ severity: 'success', summary: t('inventory.deleted', { name: item.name }), life: 2500 });
      } catch (error) {
        showError(error, 'errors.delete');
      }
    },
  });
}
</script>

<template>
  <page-header :title="t('inventory.title')" :description="t('inventory.description')">
    <template #actions>
      <pv-button icon="pi pi-plus" :label="t('inventory.new')" @click="openCreate" />
    </template>
  </page-header>

  <section class="surface-card" :aria-label="t('inventory.table-label')">
    <pv-data-table :value="inventoryStore.items" :loading="loading" data-key="id" sort-field="name" :sort-order="1"
      paginator :rows="10" :rows-per-page-options="[10, 25, 50]" :aria-label="t('inventory.table-label')">
      <template #empty><div class="empty-state">{{ t('inventory.empty') }}</div></template>
      <pv-column field="name" :header="t('inventory.columns.item')" sortable>
        <template #body="{ data }"><strong>{{ data.name }}</strong></template>
      </pv-column>
      <pv-column field="quantity" :header="t('inventory.columns.quantity')" sortable>
        <template #body="{ data }">{{ n(data.quantity, 'decimal') }} {{ data.unit }}</template>
      </pv-column>
      <pv-column field="minThreshold" :header="t('inventory.columns.min-threshold')">
        <template #body="{ data }">{{ n(data.minThreshold, 'decimal') }} {{ data.unit }}</template>
      </pv-column>
      <pv-column field="storageType" :header="t('inventory.columns.storage')">
        <template #body="{ data }">{{ t(`inventory.storage.${data.storageType}`) }}</template>
      </pv-column>
      <pv-column field="expirationDate" :header="t('inventory.columns.expires')" sortable>
        <template #body="{ data }">{{ data.expirationDate ? d(new Date(`${data.expirationDate}T00:00:00`), 'date') : '—' }}</template>
      </pv-column>
      <pv-column :header="t('inventory.columns.status')">
        <template #body="{ data }"><stock-status-tag :status="data.status" /></template>
      </pv-column>
      <pv-column :header="t('common.actions')">
        <template #body="{ data }">
          <div class="row-actions">
            <pv-button icon="pi pi-pencil" text rounded :aria-label="t('common.edit-item', { name: data.name })" v-tooltip.top="t('common.edit')" @click="openEdit(data)" />
            <pv-button icon="pi pi-trash" text rounded severity="danger" :aria-label="t('common.delete-item', { name: data.name })" v-tooltip.top="t('common.delete')" @click="remove(data)" />
          </div>
        </template>
      </pv-column>
    </pv-data-table>
  </section>

  <pv-dialog v-model:visible="dialogVisible" modal :header="editingId ? t('inventory.edit') : t('inventory.new')"
    :style="{ width: '36rem' }" :breakpoints="{ '640px': '94vw' }">
    <form id="inventory-form" novalidate @submit.prevent="save">
      <form-field id="item-name" :label="t('inventory.fields.name')" :error="errors.name">
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="form.name" :placeholder="t('inventory.placeholders.name')" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
      <div class="form-grid">
        <form-field id="item-unit" :label="t('inventory.fields.unit')" :error="errors.unit">
          <template #default="{ id, describedBy, invalid }">
            <pv-input-text :id="id" v-model="form.unit" :placeholder="t('inventory.placeholders.unit')" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
        <form-field id="item-storage" :label="t('inventory.fields.storage')" :error="errors.storageType">
          <template #default="{ id, describedBy, invalid }">
            <pv-select v-model="form.storageType" :input-id="id" :options="storageOptions" option-label="label" option-value="value" :invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
        <form-field id="item-quantity" :label="t('inventory.fields.quantity')" :error="errors.quantity">
          <template #default="{ id, describedBy, invalid }">
            <pv-input-number v-model="form.quantity" :input-id="id" :min="0" :max-fraction-digits="3" :invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
        <form-field id="item-threshold" :label="t('inventory.fields.min-threshold')" :error="errors.minThreshold" :hint="t('inventory.hints.min-threshold')">
          <template #default="{ id, describedBy, invalid }">
            <pv-input-number v-model="form.minThreshold" :input-id="id" :min="0" :max-fraction-digits="3" :invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
        <form-field id="item-shelf-life" :label="t('inventory.fields.shelf-life')" :error="errors.shelfLifeDays" :hint="t('inventory.hints.shelf-life')">
          <template #default="{ id, describedBy, invalid }">
            <pv-input-number v-model="form.shelfLifeDays" :input-id="id" :min="1" :invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
        <form-field id="item-cost" :label="t('inventory.fields.unit-cost')" :error="errors.unitCost">
          <template #default="{ id, describedBy, invalid }">
            <pv-input-number v-model="form.unitCost" :input-id="id" prefix="S/ " :min-fraction-digits="2" :max-fraction-digits="2" :min="0" :invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" outlined @click="dialogVisible = false" />
      <pv-button type="submit" form="inventory-form" icon="pi pi-save" :label="t('common.save')" :loading="saving" />
    </template>
  </pv-dialog>
</template>
