<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * Accessible form field: links the label, the control, the hint and the
 * validation message (WCAG 1.3.1, 3.3.1, 4.1.2). The control is rendered in
 * the default slot, which receives `{ id, describedBy, invalid }` to bind to
 * `id`/`input-id`, `aria-describedby` and `aria-invalid`.
 */
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  /** @type {import('vue').PropType<{code: string, params?: Object}|null>} */
  error: { type: Object, default: null },
});

const { t } = useI18n();

const hintId = computed(() => `${props.id}-hint`);
const errorId = computed(() => `${props.id}-error`);
const invalid = computed(() => props.error !== null && props.error !== undefined);
const describedBy = computed(() => [props.hint ? hintId.value : null, invalid.value ? errorId.value : null].filter(Boolean).join(' ') || undefined);
</script>

<template>
  <div class="form-field">
    <label :for="id">{{ label }}</label>
    <slot :id="id" :describedBy="describedBy" :invalid="invalid" />
    <p v-if="hint" :id="hintId" class="form-hint">{{ hint }}</p>
    <p v-if="invalid" :id="errorId" class="form-error">{{ t(error.code, error.params ?? {}) }}</p>
  </div>
</template>
