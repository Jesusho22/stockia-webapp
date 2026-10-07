<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { SUPPORTED_LOCALES } from '../../../i18n.js';

/**
 * Header control that switches the interface between English and Spanish.
 * Each option says its language name to screen readers.
 */
const { locale, t } = useI18n();

const options = computed(() => SUPPORTED_LOCALES.map((code) => ({ code, label: code.toUpperCase(), name: t(`language.${code}`) })));

const selected = computed({
  get: () => locale.value,
  set: (value) => {
    if (value) locale.value = value;
  },
});
</script>

<template>
  <div class="language-switcher" role="group" :aria-label="t('language.switcher')">
    <i class="pi pi-globe" aria-hidden="true" />
    <pv-select-button
      v-model="selected"
      :options="options"
      option-label="label"
      option-value="code"
      :allow-empty="false"
      size="small"
    >
      <template #option="{ option }">
        <span :lang="option.code" :aria-label="option.name">{{ option.label }}</span>
      </template>
    </pv-select-button>
  </div>
</template>

<style scoped>
.language-switcher { display: inline-flex; align-items: center; gap: .4rem; }
.language-switcher > .pi { color: var(--color-muted); }
</style>
