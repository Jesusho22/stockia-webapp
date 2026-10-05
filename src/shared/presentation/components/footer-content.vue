<script setup>
import { useI18n } from 'vue-i18n';

/**
 * Shared footer with authoring and data-source attribution.
 */
const { t } = useI18n();
</script>

<template>
  <footer class="app-footer" role="contentinfo">
    <p>&copy; 2026 DataBite Corp — StockIA. {{ t('footer.made-by', { team: 'DataBit' }) }}</p>
    <p>{{ t('footer.data-source') }}</p>
  </footer>
</template>

<style scoped>
.app-footer {
  padding: 1rem 1.75rem 1.5rem;
  font-size: .78rem;
  border-top: 1px solid var(--color-border);
}
.app-footer p { margin: 0 0 .25rem; }
</style>
