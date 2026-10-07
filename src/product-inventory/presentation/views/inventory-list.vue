<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useInventoryStore } from '../../application/inventory.store.js';
import { StorageType } from '../../domain/model/inventory-item.entity.js';
import { usableLotsFreshestFirst } from '../../domain/services/stock-allocation.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { DecimalQuantity, MAX_QUANTITY_DECIMALS } from '../../../shared/domain/model/decimal-quantity.js';
import { decimalQuantity, minValue, required, validate } from '../../../shared/presentation/validation.js';
import { useMoney } from '../../../shared/presentation/composables/use-money.js';
import { useQuantity } from '../../../shared/presentation/composables/use-quantity.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';
import QuantityInput from '../../../shared/presentation/components/quantity-input.vue';
import StockStatusTag from '../components/stock-status-tag.vue';

/**
 * Inventory view: register, edit and delete the supplies of the restaurant.
 *
 * @remarks
 * - Quantities accept up to 32 decimals.
 * - Each supply shows its unit price and the value of its stock.
 * - New supplies appear first (the list is ordered newest first).
 * - When a product has several lots, the lot used first in sales (the
 *   freshest one that is not expired) is marked.
 */
const { t, d } = useI18n();
const { formatMoney } = useMoney();
const { formatQuantity } = useQuantity();
const toast = useToast();
const confirm = useConfirm();
const inventoryStore = useInventoryStore();

const loading = ref(!inventoryStore.itemsLoaded);
const dialogVisible = ref(false);
const editingId = ref(null);
const submitted = ref(false);
const saving = ref(false);
const firstRow = ref(0);

const emptyForm = () => ({ name: '', unit: 'kg', quantity: '', minThreshold: '5', storageType: StorageType.AMBIENT, shelfLifeDays: 7, unitCost: 0 });
const form = reactive(emptyForm());

const storageOptions = computed(() => Object.values(StorageType).map((value) => ({ value, label: t(`inventory.storage.${value}`) })));
const errors = computed(() => (submitted.value
  ? validate(form, {
    name: [required], unit: [required], quantity: [decimalQuantity()], minThreshold: [decimalQuantity()],
    storageType: [required], shelfLifeDays: [minValue(1)], unitCost: [minValue(0)],
  })
  : {}));

/** Lots per product and the lot that sales use first (freshest, not expired). */
const lotInfo = computed(() => {
  const groups = new Map();
  for (const item of inventoryStore.items) {
    if (!groups.has(item.productKey)) groups.set(item.productKey, []);
    groups.get(item.productKey).push(item);
  }
  const info = new Map();
  for (const lots of groups.values()) {
    const preferred = usableLotsFreshestFirst(lots)[0];
    for (const lot of lots) info.set(lot.id, { count: lots.length, preferred: lots.length > 1 && preferred?.id === lot.id });
  }
  return info;
});

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
    name: item.name, unit: item.unit, quantity: DecimalQuantity.toText(item.quantity), minThreshold: DecimalQuantity.toText(item.minThreshold),
    storageType: item.storageType, shelfLifeDays: item.shelfLifeDays, unitCost: item.unitCost,
  });
  submitted.value = false;
  dialogVisible.value = true;
}

async function save() {
  submitted.value = true;
  const first = Object.values(errors.value)[0];
  if (first) {
    toast.add({ severity: 'error', summary: t('auth.errors.check-fields'), detail: t(first.code, first.params ?? {}), life: 4000 });
    return;
  }
  saving.value = true;
  try {
    await inventoryStore.saveItem({ ...form, quantity: DecimalQuantity.toText(form.quantity), minThreshold: DecimalQuantity.toText(form.minThreshold) }, editingId.value);
    dialogVisible.value = false;
    // A new supply is the first row of the list: go back to the first page.
    if (!editingId.value) firstRow.value = 0;
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
    message: t('inventory.delete-question'),
    itemName: `${item.name} · ${formatQuantity(item.quantity, item.unit)}`,
    detail: t('common.cannot-undo'),
    icon: 'pi pi-trash',
    tone: 'danger',
    defaultFocus: 'reject',
    rejectProps: { label: t('common.cancel'), icon: 'pi pi-times', severity: 'secondary', outlined: true },
    acceptProps: { label: t('inventory.delete-accept'), icon: 'pi pi-trash', severity: 'danger' },
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
    <pv-data-table v-model:first="firstRow" :value="inventoryStore.items" :loading="loading" data-key="id"
      paginator :rows="10" :rows-per-page-options="[10, 25, 50]" :aria-label="t('inventory.table-label')">
      <template #empty><div class="empty-state">{{ t('inventory.empty') }}</div></template>
      <pv-column field="name" :header="t('inventory.columns.item')" sortable>
        <template #body="{ data }">
          <strong>{{ data.name }}</strong>
          <span v-if="lotInfo.get(data.id)?.count > 1" class="lot-line">
            <pv-tag v-if="lotInfo.get(data.id).preferred" severity="success" icon="pi pi-star" :value="t('inventory.lot-preferred')" />
            <span v-else class="lot-text">{{ t('inventory.lot-of', { count: lotInfo.get(data.id).count }) }}</span>
          </span>
        </template>
      </pv-column>
      <pv-column field="quantity" :header="t('inventory.columns.quantity')">
        <template #body="{ data }"><span class="quantity-text">{{ formatQuantity(data.quantity, data.unit) }}</span></template>
      </pv-column>
      <pv-column field="unitCost" :header="t('inventory.columns.unit-price')" sortable>
        <template #body="{ data }">
          <span class="price-line"><strong>{{ formatMoney(data.unitCost) }}</strong><span class="per-unit"> / {{ data.unit }}</span></span>
          <span class="stock-value">{{ t('inventory.stock-value', { value: formatMoney(data.stockValue) }) }}</span>
        </template>
      </pv-column>
      <pv-column field="minThreshold" :header="t('inventory.columns.min-threshold')">
        <template #body="{ data }"><span class="quantity-text">{{ formatQuantity(data.minThreshold, data.unit) }}</span></template>
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
    :style="{ width: '38rem' }" :breakpoints="{ '640px': '94vw' }">
    <form id="inventory-form" novalidate @submit.prevent="save">
      <p class="form-hint mb-3">{{ t('fields.required-legend') }}</p>
      <form-field id="item-name" :label="t('inventory.fields.name')" :error="errors.name" required>
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="form.name" :placeholder="t('inventory.placeholders.name')" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
      <div class="form-grid">
        <form-field id="item-unit" :label="t('inventory.fields.unit')" :error="errors.unit" required>
          <template #default="{ id, describedBy, invalid }">
            <pv-input-text :id="id" v-model="form.unit" :placeholder="t('inventory.placeholders.unit')" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
        <form-field id="item-storage" :label="t('inventory.fields.storage')" :error="errors.storageType">
          <template #default="{ id, describedBy, invalid }">
            <pv-select v-model="form.storageType" :input-id="id" :options="storageOptions" option-label="label" option-value="value" :invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
        <form-field id="item-quantity" :label="t('inventory.fields.quantity')" :error="errors.quantity"
          :hint="t('inventory.hints.decimals', { max: MAX_QUANTITY_DECIMALS })" required>
          <template #default="{ id, describedBy, invalid }">
            <quantity-input :id="id" v-model="form.quantity" :unit="form.unit" :invalid="invalid" :described-by="describedBy" />
          </template>
        </form-field>
        <form-field id="item-threshold" :label="t('inventory.fields.min-threshold')" :error="errors.minThreshold" :hint="t('inventory.hints.min-threshold')" required>
          <template #default="{ id, describedBy, invalid }">
            <quantity-input :id="id" v-model="form.minThreshold" :unit="form.unit" :invalid="invalid" :described-by="describedBy" />
          </template>
        </form-field>
        <form-field id="item-shelf-life" :label="t('inventory.fields.shelf-life')" :error="errors.shelfLifeDays" :hint="t('inventory.hints.shelf-life')" required>
          <template #default="{ id, describedBy, invalid }">
            <pv-input-number v-model="form.shelfLifeDays" :input-id="id" :min="1" :invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </form-field>
        <form-field id="item-cost" :label="t('inventory.fields.unit-cost')" :error="errors.unitCost" :hint="t('inventory.hints.unit-cost')" required>
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

<style scoped>
.lot-line { display: block; margin-top: .25rem; }
.lot-text { font-size: .75rem; color: var(--color-muted); }
.quantity-text { font-variant-numeric: tabular-nums; word-break: break-all; }
.price-line { white-space: nowrap; }
.per-unit { color: var(--color-muted); font-size: .85rem; }
.stock-value { display: block; font-size: .75rem; color: var(--color-muted); white-space: nowrap; }
</style>
