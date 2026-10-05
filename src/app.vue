<script setup>
import { watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * Presentation shell component.
 *
 * @remarks
 * Hosts the routed views plus the global toast and confirmation outlets, and
 * keeps the document language in sync with the active locale (WCAG 3.1.1).
 */
const { locale, t } = useI18n();

watchEffect(() => {
  document.documentElement.lang = locale.value;
  document.title = t('app.document-title');
});
</script>

<template>
  <a class="skip-link" href="#main-content">{{ t('app.skip-to-content') }}</a>
  <router-view />
  <pv-toast position="top-right" />
  <pv-confirm-dialog />
</template>
