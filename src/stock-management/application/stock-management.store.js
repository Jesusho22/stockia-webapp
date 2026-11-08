import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { StockManagementApi } from '../infrastructure/stock-management-api.js';
import { InventoryItemAssembler } from '../infrastructure/inventory-item.assembler.js';
import { InventoryItem, StockStatus, expirationDateFor } from '../domain/model/inventory-item.entity.js';
import { planAllocation } from '../domain/services/stock-allocation.js';

const stockManagementApi = new StockManagementApi();

/**
 * The API assigns increasing ids, so the highest id is the last one added.
 *
 * @template {{id: number}} T
 * @param {T[]} list
 * @returns {T[]}
 */
function newestFirst(list) {
  return [...list].sort((a, b) => Number(b.id) - Number(a.id));
}

/**
 * Application layer of the Stock Management Bounded Context: supplies (lots)
 * with their expiration date and status.
 *
 * @remarks
 * - `planSale` checks what a dish needs against the stock with the allocation
 *   domain service (expired lots are never used; the freshest lot goes first),
 *   so Recipes Management can show which dishes are ready to sell.
 * - The stock deduction of a sale runs in the StockIA Platform API, in the
 *   same transaction as the sale.
 * - The list is kept newest first, so a new supply appears at the top.
 */
export const useStockManagementStore = defineStore('stock-management', () => {
  /** @type {import('vue').Ref<InventoryItem[]>} */
  const items = ref([]);
  const itemsLoaded = ref(false);

  const attentionCount = computed(() => items.value.filter((item) => item.status === StockStatus.LOW || item.status === StockStatus.CRITICAL).length);
  const expiringSoonCount = computed(() => items.value.filter((item) => item.isExpiringSoon).length);
  const inventoryValue = computed(() => items.value.reduce((sum, item) => sum + item.stockValue, 0));
  const itemsNeedingAttention = computed(() => items.value.filter((item) => item.needsAttention));

  async function loadItems() {
    const response = await stockManagementApi.getInventoryItems();
    items.value = newestFirst(InventoryItemAssembler.toEntitiesFromResponse(response));
    itemsLoaded.value = true;
  }

  /**
   * Registers or edits a supply. The expiration date is recalculated from the
   * shelf life every time the batch is saved.
   *
   * @param {{name: string, unit: string, quantity: string, minThreshold: string, storageType: string, shelfLifeDays: number, unitCost: number}} form
   *   quantities as text with up to 32 decimals
   * @param {number|null} id `null` to create a new supply
   */
  async function saveItem(form, id = null) {
    const item = new InventoryItem({ ...form, id: id ?? 0, name: form.name.trim(), unit: form.unit.trim(), expirationDate: expirationDateFor(form.shelfLifeDays) });
    const resource = InventoryItemAssembler.toResourceFromEntity(item);
    if (id) {
      await stockManagementApi.updateInventoryItem(id, resource);
    } else {
      delete resource.id;
      await stockManagementApi.createInventoryItem(resource);
    }
    await loadItems();
  }

  /** @param {InventoryItem} item */
  async function deleteItem(item) {
    await stockManagementApi.deleteInventoryItem(item.id);
    await loadItems();
  }

  /**
   * Checks whether the stock can supply a dish, without changing anything.
   *
   * @param {{ingredients: {inventoryItemId: number, quantityRequired: string}[]}} dish a recipe of Recipes Management
   * @param {number} [portions]
   * @returns {import('../domain/services/stock-allocation.js').AllocationPlan}
   */
  function planSale(dish, portions = 1) {
    return planAllocation(dish, items.value, portions);
  }

  return {
    items, itemsLoaded, attentionCount, expiringSoonCount, inventoryValue, itemsNeedingAttention,
    loadItems, saveItem, deleteItem, planSale,
  };
});
