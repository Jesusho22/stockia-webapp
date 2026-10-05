<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from '../../../i18n.js';

/**
 * Presentation component that switches the active locale (en / es) and
 * remembers the choice in this browser.
 */
const { locale, t } = useI18n();

const options = computed(() => SUPPORTED_LOCALES.map((code) => ({ code, label: code.toUpperCase(), name: t(`language.${code}`) })));

const selected = computed({
  get: () => locale.value,
  set: (value) => {
    if (!value) return;
    locale.value = value;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, value);
    } catch {
      /* storage blocked: the choice lasts for this session only */
    }
  },
});
</script>

<template>
  <div role="group" :aria-label="t('language.switcher')">
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
