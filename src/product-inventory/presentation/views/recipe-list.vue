<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useInventoryStore } from '../../application/inventory.store.js';
import { useSalesStore } from '../../../sales-order/application/sales.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { useMoney } from '../../../shared/presentation/composables/use-money.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';

/**
 * Recipes view: link supplies to each dish so stock is discounted when it is
 * sold. "Sell one" registers a real sale in Sales & Order Management, which
 * validates the stock first and rejects the sale if any supply is short.
 */
const { t, n } = useI18n();
const toast = useToast();
const { formatMoney } = useMoney();
const confirm = useConfirm();
const inventoryStore = useInventoryStore();
const salesStore = useSalesStore();

const loading = ref(!inventoryStore.recipesLoaded);
const sellingId = ref(null);
const dialogVisible = ref(false);
const editingId = ref(null);
const saving = ref(false);
const submitted = ref(false);
const draft = reactive({ dishName: '', ingredients: [] });
const lineDraft = reactive({ inventoryItemId: null, quantityRequired: 1 });
const lineError = ref(null);

const itemOptions = computed(() => inventoryStore.items.map((item) => ({ value: item.id, label: `${item.name} (${item.unit})` })));
const dishNameInvalid = computed(() => submitted.value && !draft.dishName.trim());
const ingredientsInvalid = computed(() => submitted.value && draft.ingredients.length === 0);

function showError(error, fallback) {
  const { code, params } = toErrorMessage(error, fallback);
  toast.add({ severity: 'error', summary: t(code, params), life: 5000 });
}

onMounted(async () => {
  try {
    await Promise.all([inventoryStore.loadItems(), inventoryStore.loadRecipes()]);
  } catch (error) {
    showError(error, 'errors.load');
  } finally {
    loading.value = false;
  }
});

function resetLineDraft() {
  Object.assign(lineDraft, { inventoryItemId: null, quantityRequired: 1 });
  lineError.value = null;
}

function openCreate() {
  editingId.value = null;
  Object.assign(draft, { dishName: '', ingredients: [] });
  resetLineDraft();
  submitted.value = false;
  dialogVisible.value = true;
}

/** @param {import('../../domain/model/recipe.entity.js').Recipe} recipe */
function openEdit(recipe) {
  editingId.value = recipe.id;
  Object.assign(draft, { dishName: recipe.dishName, ingredients: recipe.ingredients.map((line) => ({ ...line })) });
  resetLineDraft();
  submitted.value = false;
  dialogVisible.value = true;
}

function addLine() {
  const item = inventoryStore.items.find((candidate) => candidate.id === lineDraft.inventoryItemId);
  if (!item || !(lineDraft.quantityRequired > 0)) {
    lineError.value = t('recipes.errors.line');
    return;
  }
  const existing = draft.ingredients.find((line) => line.inventoryItemId === item.id);
  if (existing) existing.quantityRequired = lineDraft.quantityRequired;
  else draft.ingredients.push({ inventoryItemId: item.id, inventoryItemName: item.name, quantityRequired: lineDraft.quantityRequired, unit: item.unit });
  resetLineDraft();
}

function removeLine(index) {
  draft.ingredients.splice(index, 1);
}

async function save() {
  submitted.value = true;
  if (dishNameInvalid.value || ingredientsInvalid.value) return;
  saving.value = true;
  try {
    await inventoryStore.saveRecipe({ dishName: draft.dishName, ingredients: draft.ingredients }, editingId.value);
    dialogVisible.value = false;
    toast.add({ severity: 'success', summary: t(editingId.value ? 'recipes.updated' : 'recipes.created', { name: draft.dishName }), life: 2500 });
  } catch (error) {
    showError(error, 'errors.save');
  } finally {
    saving.value = false;
  }
}

/** @param {import('../../domain/model/recipe.entity.js').Recipe} recipe */
async function sell(recipe) {
  sellingId.value = recipe.id;
  try {
    const sale = await salesStore.registerSale(recipe.id);
    toast.add({ severity: 'success', summary: t('recipes.sold', { dish: recipe.dishName, total: formatMoney(sale.total) }), detail: t('recipes.sold-detail'), life: 3500 });
  } catch (error) {
    showError(error, 'errors.save');
  } finally {
    sellingId.value = null;
  }
}

function remove(recipe) {
  confirm.require({
    header: t('recipes.delete-title'),
    message: t('recipes.delete-confirm', { name: recipe.dishName }),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('common.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('common.delete'), severity: 'danger' },
    accept: async () => {
      try {
        await inventoryStore.deleteRecipe(recipe);
        toast.add({ severity: 'success', summary: t('recipes.deleted', { name: recipe.dishName }), life: 2500 });
      } catch (error) {
        showError(error, 'errors.delete');
      }
    },
  });
}
</script>

<template>
  <page-header :title="t('recipes.title')" :description="t('recipes.description')">
    <template #actions>
      <pv-button icon="pi pi-plus" :label="t('recipes.new')" @click="openCreate" />
    </template>
  </page-header>

  <section class="surface-card" :aria-label="t('recipes.table-label')">
    <pv-data-table :value="inventoryStore.recipes" :loading="loading" data-key="id" :aria-label="t('recipes.table-label')">
      <template #empty><div class="empty-state">{{ t('recipes.empty') }}</div></template>
      <pv-column field="dishName" :header="t('recipes.columns.dish')">
        <template #body="{ data }"><strong>{{ data.dishName }}</strong></template>
      </pv-column>
      <pv-column :header="t('recipes.columns.ingredients')">
        <template #body="{ data }">
          <ul class="ingredient-list" :aria-label="t('recipes.ingredients-of', { name: data.dishName })">
            <li v-for="line in data.ingredients" :key="line.inventoryItemId">
              <pv-tag severity="secondary" :value="`${line.inventoryItemName} · ${n(line.quantityRequired, 'decimal')} ${line.unit}`" />
            </li>
          </ul>
        </template>
      </pv-column>
      <pv-column :header="t('common.actions')">
        <template #body="{ data }">
          <div class="row-actions">
            <pv-button icon="pi pi-shopping-cart" size="small" outlined :label="t('recipes.sell')" :loading="sellingId === data.id"
              :aria-label="t('recipes.sell-dish', { name: data.dishName })" @click="sell(data)" />
            <pv-button icon="pi pi-pencil" text rounded :aria-label="t('common.edit-item', { name: data.dishName })" v-tooltip.top="t('common.edit')" @click="openEdit(data)" />
            <pv-button icon="pi pi-trash" text rounded severity="danger" :aria-label="t('common.delete-item', { name: data.dishName })" v-tooltip.top="t('common.delete')" @click="remove(data)" />
          </div>
        </template>
      </pv-column>
    </pv-data-table>
  </section>

  <pv-dialog v-model:visible="dialogVisible" modal :header="editingId ? t('recipes.edit') : t('recipes.new')"
    :style="{ width: '40rem' }" :breakpoints="{ '680px': '94vw' }">
    <div class="form-field">
      <label for="recipe-dish-name">{{ t('recipes.fields.dish-name') }}</label>
      <pv-input-text id="recipe-dish-name" v-model="draft.dishName" :placeholder="t('recipes.placeholders.dish-name')"
        :invalid="dishNameInvalid" :aria-invalid="dishNameInvalid" :aria-describedby="dishNameInvalid ? 'recipe-dish-name-error' : undefined" />
      <p v-if="dishNameInvalid" id="recipe-dish-name-error" class="form-error">{{ t('validation.required') }}</p>
    </div>

    <fieldset class="ingredient-picker">
      <legend>{{ t('recipes.add-ingredient') }}</legend>
      <div class="picker-row">
        <div class="form-field picker-item">
          <label for="recipe-line-item">{{ t('recipes.fields.supply') }}</label>
          <pv-select v-model="lineDraft.inventoryItemId" input-id="recipe-line-item" :options="itemOptions" option-label="label" option-value="value"
            filter :placeholder="t('recipes.placeholders.supply')" :aria-describedby="lineError ? 'recipe-line-error' : undefined" />
        </div>
        <div class="form-field picker-qty">
          <label for="recipe-line-qty">{{ t('recipes.fields.quantity') }}</label>
          <pv-input-number v-model="lineDraft.quantityRequired" input-id="recipe-line-qty" :min="0" :max-fraction-digits="3" />
        </div>
        <pv-button type="button" icon="pi pi-plus" severity="secondary" :label="t('common.add')" class="picker-add" @click="addLine" />
      </div>
      <p v-if="lineError" id="recipe-line-error" class="form-error" role="alert">{{ lineError }}</p>
    </fieldset>

    <pv-data-table v-if="draft.ingredients.length > 0" :value="draft.ingredients" size="small" class="mt-3" :aria-label="t('recipes.columns.ingredients')">
      <pv-column field="inventoryItemName" :header="t('recipes.fields.supply')" />
      <pv-column :header="t('recipes.fields.required-quantity')">
        <template #body="{ data }">{{ n(data.quantityRequired, 'decimal') }} {{ data.unit }}</template>
      </pv-column>
      <pv-column :header="t('common.actions')">
        <template #body="{ data, index }">
          <pv-button icon="pi pi-times" text rounded severity="danger" :aria-label="t('recipes.remove-line', { name: data.inventoryItemName })" @click="removeLine(index)" />
        </template>
      </pv-column>
    </pv-data-table>
    <p v-if="ingredientsInvalid" class="form-error mt-2" role="alert">{{ t('recipes.errors.no-ingredients') }}</p>

    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" outlined @click="dialogVisible = false" />
      <pv-button icon="pi pi-save" :label="editingId ? t('common.save-changes') : t('recipes.save')" :loading="saving" @click="save" />
    </template>
  </pv-dialog>
</template>

<style scoped>
.ingredient-list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: .35rem; }
.ingredient-picker { border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: .75rem 1rem 0; margin: 0; }
.ingredient-picker legend { font-size: .85rem; font-weight: 600; color: var(--color-primary-dark); padding: 0 .35rem; }
.picker-row { display: flex; gap: .75rem; align-items: flex-end; flex-wrap: wrap; }
.picker-item { flex: 2 1 220px; }
.picker-qty { flex: 1 1 120px; }
.picker-add { margin-bottom: 1rem; }
</style>
