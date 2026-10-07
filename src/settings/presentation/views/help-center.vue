<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useIamStore } from '../../../iam/application/iam.store.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';

/**
 * Settings › Get help: a step-by-step guide of the StockIA flow for new users
 * and the frequently asked questions (searchable).
 *
 * @remarks
 * Steps marked `adminOnly` are shown with an "Administrator" tag to the
 * Administrator and hidden from Employees, because they cannot open them.
 */
const { t } = useI18n();
const iamStore = useIamStore();

const STEPS = [
  { key: 'inventory', icon: 'pi pi-box', to: '/app/inventory' },
  { key: 'recipes', icon: 'pi pi-book', to: '/app/recipes' },
  { key: 'sell', icon: 'pi pi-shopping-cart', to: '/app/recipes' },
  { key: 'sales', icon: 'pi pi-receipt', to: '/app/sales' },
  { key: 'alerts', icon: 'pi pi-bell', to: '/app/alerts' },
  { key: 'forecast', icon: 'pi pi-chart-line', to: '/app/forecast' },
  { key: 'recommendations', icon: 'pi pi-lightbulb', to: '/app/recommendations', adminOnly: true },
  { key: 'team', icon: 'pi pi-users', to: '/app/roles', adminOnly: true },
  { key: 'settings', icon: 'pi pi-cog', to: '/app/settings/account' },
];
const FAQ_KEYS = ['no-stock', 'expired', 'freshest', 'dish-price', 'decimals', 'void', 'critical-alert', 'roles', 'password', 'language'];

const steps = computed(() => STEPS.filter((step) => !step.adminOnly || iamStore.isAdmin));
const query = ref('');
const faqs = computed(() => {
  const text = query.value.trim().toLowerCase();
  return FAQ_KEYS
    .map((key) => ({ key, question: t(`help.faq.${key}.q`), answer: t(`help.faq.${key}.a`) }))
    .filter((faq) => !text || `${faq.question} ${faq.answer}`.toLowerCase().includes(text));
});
</script>

<template>
  <page-header :title="t('nav.settings-help')" :description="t('help.description')" />

  <section class="surface-card mb-4" aria-labelledby="help-guide-title">
    <h2 id="help-guide-title"><i class="pi pi-compass" aria-hidden="true" /> {{ t('help.guide-title') }}</h2>
    <p>{{ t('help.guide-intro') }}</p>
    <ol class="guide-steps">
      <li v-for="(step, index) in steps" :key="step.key" class="guide-step">
        <span class="step-number" aria-hidden="true">{{ index + 1 }}</span>
        <div class="step-body">
          <h3>
            <i :class="step.icon" aria-hidden="true" /> {{ t(`help.steps.${step.key}.title`) }}
            <pv-tag v-if="step.adminOnly" severity="secondary" :value="t('iam.roles.ADMIN')" class="ml-2" />
          </h3>
          <p>{{ t(`help.steps.${step.key}.body`) }}</p>
          <p class="step-tip"><i class="pi pi-lightbulb" aria-hidden="true" /> {{ t(`help.steps.${step.key}.tip`) }}</p>
          <router-link :to="step.to" class="step-link">{{ t('help.go-to', { section: t(`help.steps.${step.key}.title`) }) }} →</router-link>
        </div>
      </li>
    </ol>
  </section>

  <section class="surface-card mb-4" aria-labelledby="help-roles-title">
    <h2 id="help-roles-title"><i class="pi pi-shield" aria-hidden="true" /> {{ t('help.roles-title') }}</h2>
    <div class="table-scroll">
      <table class="roles-table">
        <caption class="sr-only">{{ t('help.roles-title') }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ t('help.roles-feature') }}</th>
            <th scope="col">{{ t('iam.roles.ADMIN') }}</th>
            <th scope="col">{{ t('iam.roles.EMPLOYEE') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in ['operation', 'recommendations', 'team', 'subscription']" :key="row">
            <th scope="row">{{ t(`help.roles-rows.${row}`) }}</th>
            <td><i class="pi pi-check-circle is-yes" aria-hidden="true" /> {{ t('help.yes') }}</td>
            <td v-if="row === 'operation'"><i class="pi pi-check-circle is-yes" aria-hidden="true" /> {{ t('help.yes') }}</td>
            <td v-else><i class="pi pi-times-circle is-no" aria-hidden="true" /> {{ t('help.no') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="surface-card" aria-labelledby="help-faq-title">
    <div class="faq-header">
      <h2 id="help-faq-title"><i class="pi pi-comments" aria-hidden="true" /> {{ t('help.faq-title') }}</h2>
      <label for="help-faq-search" class="sr-only">{{ t('help.faq-search') }}</label>
      <span class="faq-search">
        <i class="pi pi-search" aria-hidden="true" />
        <pv-input-text id="help-faq-search" v-model="query" type="search" :placeholder="t('help.faq-search')" />
      </span>
    </div>
    <p class="sr-only" role="status">{{ t('help.faq-results', { count: faqs.length }, faqs.length) }}</p>
    <div v-if="faqs.length > 0" class="faq-list">
      <details v-for="faq in faqs" :key="faq.key" class="faq-item">
        <summary>{{ faq.question }}</summary>
        <p>{{ faq.answer }}</p>
      </details>
    </div>
    <p v-else class="empty-state">{{ t('help.faq-empty') }}</p>
  </section>
</template>

<style scoped>
h2 { display: flex; align-items: center; gap: .5rem; }
.guide-steps { list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
.guide-step { display: flex; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); }
.guide-step:last-child { border-bottom: none; padding-bottom: 0; }
.step-number {
  flex-shrink: 0; width: 2.2rem; height: 2.2rem; border-radius: 50%;
  background: var(--color-primary-dark); color: #fff; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center;
}
.step-body { min-width: 0; }
.step-body h3 { display: flex; align-items: center; flex-wrap: wrap; gap: .4rem; }
.step-body p { color: var(--color-text); margin-bottom: .4rem; }
.step-tip { font-size: .85rem; background: var(--color-warning-bg); color: #5c4306 !important; padding: .45rem .65rem; border-radius: var(--radius-sm); }
.step-link { font-size: .88rem; font-weight: 600; color: var(--color-accent-strong); }
.table-scroll { overflow-x: auto; }
.roles-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
.roles-table th, .roles-table td { padding: .6rem .75rem; border-bottom: 1px solid var(--color-border); text-align: left; }
.roles-table thead th { font-size: .75rem; text-transform: uppercase; color: var(--color-muted); }
.is-yes { color: var(--color-success); }
.is-no { color: var(--color-danger); }
.faq-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .75rem; margin-bottom: .75rem; }
.faq-header h2 { margin: 0; }
.faq-search { position: relative; flex: 0 1 280px; }
.faq-search .pi { position: absolute; left: .75rem; top: 50%; transform: translateY(-50%); color: var(--color-muted); }
.faq-search :deep(.p-inputtext) { width: 100%; padding-left: 2.2rem; }
.faq-list { display: flex; flex-direction: column; gap: .5rem; }
.faq-item { border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: .25rem .9rem; background: var(--color-surface); }
.faq-item[open] { border-color: var(--color-accent); }
.faq-item summary { cursor: pointer; font-weight: 600; color: var(--color-primary-dark); padding: .6rem 0; }
.faq-item p { color: var(--color-text); }
</style>
