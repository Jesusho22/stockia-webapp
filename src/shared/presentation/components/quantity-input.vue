<script setup>
import { computed } from 'vue';
import { MAX_QUANTITY_DECIMALS } from '../../domain/model/decimal-quantity.js';

/**
 * Text field for quantities with up to 32 decimals.
 *
 * @remarks
 * A number input would round the value to about 15 digits, so the quantity is
 * kept as text. Only digits and one decimal separator ("." or ",") are kept,
 * and extra decimals beyond 32 are cut while typing. Mobile keyboards show the
 * numeric pad (`inputmode="decimal"`).
 */
const props = defineProps({
  id: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  unit: { type: String, default: '' },
  placeholder: { type: String, default: '0' },
  invalid: { type: Boolean, default: false },
  describedBy: { type: String, default: undefined },
});
const emit = defineEmits(['update:modelValue']);

/**
 * @param {string} text
 * @returns {string} digits plus at most one separator and 32 decimals
 */
function sanitize(text) {
  const cleaned = String(text ?? '').replace(/[^\d.,]/g, '');
  const separatorIndex = cleaned.search(/[.,]/);
  if (separatorIndex === -1) return cleaned;
  const integer = cleaned.slice(0, separatorIndex) || '0';
  const fraction = cleaned.slice(separatorIndex + 1).replace(/[.,]/g, '').slice(0, MAX_QUANTITY_DECIMALS);
  return `${integer}${cleaned[separatorIndex]}${fraction}`;
}

const value = computed({
  get: () => String(props.modelValue ?? ''),
  set: (text) => emit('update:modelValue', sanitize(text)),
});
</script>

<template>
  <div class="quantity-input">
    <pv-input-text
      :id="id"
      v-model="value"
      inputmode="decimal"
      autocomplete="off"
      :placeholder="placeholder"
      :invalid="invalid"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
    />
    <span v-if="unit" class="quantity-unit" aria-hidden="true">{{ unit }}</span>
  </div>
</template>

<style scoped>
.quantity-input { position: relative; width: 100%; }
.quantity-input :deep(.p-inputtext) { width: 100%; padding-right: 3rem; font-variant-numeric: tabular-nums; }
.quantity-unit {
  position: absolute;
  right: .75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: .8rem;
  color: var(--color-muted);
  pointer-events: none;
}
</style>
