<script setup>
/**
 * Presentation component with the title, description and main actions of a view.
 * The title is the only `h1` of the page, so screen readers can navigate by headings.
 */
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
});
</script>

<template>
  <header class="page-header">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.page-header p { max-width: 620px; margin: 0; }
.page-header-actions { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
</style>
