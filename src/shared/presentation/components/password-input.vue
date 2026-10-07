<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * Password field with a real "show / hide password" button.
 *
 * @remarks
 * The toggle is a `<button>` reachable with the keyboard; its label changes
 * between "Show password" and "Hide password" and `aria-pressed` tells screen
 * readers whether the password is visible (WCAG 4.1.2).
 */
const props = defineProps({
  id: { type: String, required: true },
  modelValue: { type: String, default: '' },
  autocomplete: { type: String, default: 'current-password' },
  placeholder: { type: String, default: '' },
  invalid: { type: Boolean, default: false },
  describedBy: { type: String, default: undefined },
  required: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();
const visible = ref(false);

const value = computed({
  get: () => props.modelValue,
  set: (text) => emit('update:modelValue', text),
});
</script>

<template>
  <div class="password-input" :class="{ 'is-invalid': invalid }">
    <pv-input-text
      :id="id"
      v-model="value"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :invalid="invalid"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      :aria-required="required || undefined"
      spellcheck="false"
      autocapitalize="off"
    />
    <button
      type="button"
      class="password-toggle"
      :aria-label="visible ? t('fields.hide-password') : t('fields.show-password')"
      :aria-pressed="visible"
      :aria-controls="id"
      :title="visible ? t('fields.hide-password') : t('fields.show-password')"
      @click="visible = !visible"
    >
      <i :class="visible ? 'pi pi-eye-slash' : 'pi pi-eye'" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.password-input { position: relative; width: 100%; }
.password-input :deep(.p-inputtext) { width: 100%; padding-right: 2.9rem; }
.password-toggle {
  position: absolute;
  top: 50%;
  right: .3rem;
  transform: translateY(-50%);
  width: 2.3rem;
  height: 2.3rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.password-toggle:hover { background: var(--color-bg); color: var(--color-primary-dark); }
</style>
