<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useRouter } from 'vue-router';
import { useInventoryStore } from '../../application/inventory.store.js';
import { useSalesStore } from '../../../sales-order/application/sales.store.js';
import { Recipe } from '../../domain/model/recipe.entity.js';
import { ShortageReason } from '../../domain/services/stock-allocation.js';
import { BusinessRuleError, toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { DecimalQuantity, MAX_QUANTITY_DECIMALS } from '../../../shared/domain/model/decimal-quantity.js';
import { decimalQuantity } from '../../../shared/presentation/validation.js';
import { useMoney } from '../../../shared/presentation/composables/use-money.js';
import { useQuantity } from '../../../shared/presentation/composables/use-quantity.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';
import QuantityInput from '../../../shared/presentation/components/quantity-input.vue';

/**
 * Recipes view: link supplies to each dish so stock is discounted when it is
 * sold. "Sell one" registers a real sale in Sales & Order Management, which
 * validates the stock first and rejects the sale if any supply is missing,
 * short or expired; in that case a dialog in the middle of the screen explains
 * why and no sale is registered.
 *
 * @remarks
 * The price of each dish is the sum of the cost of its ingredients
 * (required quantity × unit price of the supply).
 */
const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const { formatMoney } = useMoney();
const { formatQuantity } = useQuantity();
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
const lineDraft = reactive({ inventoryItemId: null, quantityRequired: '1' });
const lineError = ref(null);
/** @type {import('vue').Ref<{dish: string, shortages: import('../../domain/services/stock-allocation.js').Shortage[]}|null>} */
const blockedSale = ref(null);

// One option per product: when a product has several lots, sales pick the freshest one anyway.
const itemOptions = computed(() => {
  const seen = new Set();
  return inventoryStore.items
    .filter((item) => (seen.has(item.productKey) ? false : seen.add(item.productKey)))
    .map((item) => ({ value: item.id, label: `${item.name} (${item.unit}) · ${formatMoney(item.unitCost)} / ${item.unit}` }));
});
const draftPrice = computed(() => new Recipe({ ingredients: draft.ingredients }).priceWith(inventoryStore.items));

/** @param {import('../../domain/model/recipe.entity.js').RecipeIngredientLine} line */
function lineCost(line) {
  return new Recipe({ ingredients: [line] }).priceWith(inventoryStore.items);
}

/**
 * @param {Recipe} recipe
 * @returns {{severity: string, label: string}}
 */
function availabilityOf(recipe) {
  const shortages = recipe.shortagesWith(inventoryStore.items);
  if (shortages.length === 0) return { severity: 'success', label: t('recipes.availability.ready') };
  if (shortages.some((shortage) => shortage.reason === ShortageReason.EXPIRED)) return { severity: 'danger', label: t('recipes.availability.expired') };
  return { severity: 'warn', label: t('recipes.availability.no-stock') };
}
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
  Object.assign(lineDraft, { inventoryItemId: null, quantityRequired: '1' });
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
  const quantityError = decimalQuantity({ positive: true })(lineDraft.quantityRequired);
  if (!item || quantityError) {
    lineError.value = !item ? t('recipes.errors.line') : t(quantityError.code, quantityError.params ?? {});
    return;
  }
  const quantityRequired = DecimalQuantity.toText(lineDraft.quantityRequired);
  const existing = draft.ingredients.find((line) => line.inventoryItemId === item.id);
  if (existing) existing.quantityRequired = quantityRequired;
  // The last ingredient added is shown first.
  else draft.ingredients.unshift({ inventoryItemId: item.id, inventoryItemName: item.name, quantityRequired, unit: item.unit });
  resetLineDraft();
}

function removeLine(index) {
  draft.ingredients.splice(index, 1);
}

async function save() {
  submitted.value = true;
  if (dishNameInvalid.value || ingredientsInvalid.value) {
    toast.add({ severity: 'error', summary: t('auth.errors.check-fields'), detail: t(dishNameInvalid.value ? 'validation.required' : 'recipes.errors.no-ingredients'), life: 4000 });
    return;
  }
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
    if (error instanceof BusinessRuleError && error.code === 'sales.errors.cannot-sell') {
      blockedSale.value = { dish: error.params.dish, shortages: error.params.shortages ?? [] };
    } else {
      showError(error, 'errors.save');
    }
  } finally {
    sellingId.value = null;
  }
}

function goToInventory() {
  blockedSale.value = null;
  router.push('/app/inventory');
}

function remove(recipe) {
  confirm.require({
    header: t('recipes.delete-title'),
    message: t('recipes.delete-question'),
    itemName: recipe.dishName,
    detail: t('common.cannot-undo'),
    icon: 'pi pi-trash',
    defaultFocus: 'reject',
    rejectProps: { label: t('common.cancel'), icon: 'pi pi-times', severity: 'secondary', outlined: true },
    acceptProps: { label: t('recipes.delete-accept'), icon: 'pi pi-trash', severity: 'danger' },
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
        <template #body="{ data }">
          <strong>{{ data.dishName }}</strong>
          <span class="availability"><pv-tag :severity="availabilityOf(data).severity" :value="availabilityOf(data).label" /></span>
        </template>
      </pv-column>
      <pv-column :header="t('recipes.columns.price')">
        <template #body="{ data }">
          <strong class="dish-price">{{ formatMoney(inventoryStore.priceOf(data)) }}</strong>
          <span class="price-note">{{ t('recipes.price-note') }}</span>
        </template>
      </pv-column>
      <pv-column :header="t('recipes.columns.ingredients')">
        <template #body="{ data }">
          <ul class="ingredient-list" :aria-label="t('recipes.ingredients-of', { name: data.dishName })">
            <li v-for="line in data.ingredients" :key="line.inventoryItemId">
              <pv-tag severity="secondary" :value="`${line.inventoryItemName} · ${formatQuantity(line.quantityRequired, line.unit)}`" />
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
          <quantity-input id="recipe-line-qty" v-model="lineDraft.quantityRequired" :described-by="lineError ? 'recipe-line-error' : 'recipe-line-hint'" />
        </div>
        <pv-button type="button" icon="pi pi-plus" severity="secondary" :label="t('common.add')" class="picker-add" @click="addLine" />
      </div>
      <p v-if="lineError" id="recipe-line-error" class="form-error" role="alert">{{ lineError }}</p>
      <p v-else id="recipe-line-hint" class="form-hint mb-3">{{ t('inventory.hints.decimals', { max: MAX_QUANTITY_DECIMALS }) }}</p>
    </fieldset>

    <pv-data-table v-if="draft.ingredients.length > 0" :value="draft.ingredients" size="small" class="mt-3" :aria-label="t('recipes.columns.ingredients')">
      <pv-column field="inventoryItemName" :header="t('recipes.fields.supply')" />
      <pv-column :header="t('recipes.fields.required-quantity')">
        <template #body="{ data }"><span class="quantity-text">{{ formatQuantity(data.quantityRequired, data.unit) }}</span></template>
      </pv-column>
      <pv-column :header="t('recipes.columns.cost')">
        <template #body="{ data }">{{ formatMoney(lineCost(data)) }}</template>
      </pv-column>
      <pv-column :header="t('common.actions')">
        <template #body="{ data, index }">
          <pv-button icon="pi pi-times" text rounded severity="danger" :aria-label="t('recipes.remove-line', { name: data.inventoryItemName })" @click="removeLine(index)" />
        </template>
      </pv-column>
    </pv-data-table>
    <p v-if="ingredientsInvalid" class="form-error mt-2" role="alert">{{ t('recipes.errors.no-ingredients') }}</p>
    <p class="draft-price" aria-live="polite">
      <span>{{ t('recipes.dish-price') }}</span>
      <strong>{{ formatMoney(draftPrice) }}</strong>
    </p>

    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" outlined @click="dialogVisible = false" />
      <pv-button icon="pi pi-save" :label="editingId ? t('common.save-changes') : t('recipes.save')" :loading="saving" @click="save" />
    </template>
  </pv-dialog>

  <!-- Sale not processed: shown in the middle of the screen. -->
  <pv-dialog :visible="blockedSale !== null" modal :closable="false" :draggable="false" role="alertdialog"
    class="sale-blocked-dialog" :style="{ width: '30rem' }" :breakpoints="{ '640px': '92vw' }"
    :header="t('recipes.blocked.title')" @update:visible="(value) => { if (!value) blockedSale = null; }">
    <div v-if="blockedSale" class="blocked-body">
      <span class="blocked-icon" aria-hidden="true"><i class="pi pi-ban" /></span>
      <p class="blocked-lead">{{ t('recipes.blocked.lead', { dish: blockedSale.dish }) }}</p>
      <ul class="shortage-list">
        <li v-for="shortage in blockedSale.shortages" :key="shortage.itemName" :class="`is-${shortage.reason.toLowerCase()}`">
          <i :class="shortage.reason === 'EXPIRED' ? 'pi pi-calendar-times' : 'pi pi-box'" aria-hidden="true" />
          <div>
            <strong>{{ shortage.itemName }}</strong>
            <span>{{ t(`recipes.shortage.${shortage.reason}`) }}</span>
            <span class="shortage-numbers">
              {{ t('recipes.shortage.numbers', { required: formatQuantity(shortage.required, shortage.unit), available: formatQuantity(shortage.available, shortage.unit) }) }}
            </span>
          </div>
        </li>
      </ul>
      <p class="blocked-note">{{ t('recipes.blocked.note') }}</p>
    </div>
    <template #footer>
      <pv-button :label="t('recipes.blocked.go-inventory')" icon="pi pi-box" severity="secondary" outlined @click="goToInventory" />
      <pv-button :label="t('recipes.blocked.ok')" icon="pi pi-check" autofocus @click="blockedSale = null" />
    </template>
  </pv-dialog>
</template>

<style scoped>
.availability { display: block; margin-top: .3rem; }
.dish-price { display: block; font-size: 1.05rem; color: var(--color-primary-dark); }
.price-note { display: block; font-size: .72rem; color: var(--color-muted); }
.quantity-text { font-variant-numeric: tabular-nums; word-break: break-all; }
.draft-price {
  display: flex; justify-content: space-between; align-items: center; margin: 1rem 0 0; padding: .75rem 1rem;
  border-radius: var(--radius-sm); background: var(--color-success-bg); color: var(--color-success); font-weight: 600;
}
.draft-price strong { font-size: 1.2rem; }
.ingredient-list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: .35rem; }
.ingredient-picker { border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: .75rem 1rem 0; margin: 0; }
.ingredient-picker legend { font-size: .85rem; font-weight: 600; color: var(--color-primary-dark); padding: 0 .35rem; }
.picker-row { display: flex; gap: .75rem; align-items: flex-end; flex-wrap: wrap; }
.picker-item { flex: 2 1 220px; }
.picker-qty { flex: 1 1 120px; }
.picker-add { margin-bottom: 1rem; }
</style>
