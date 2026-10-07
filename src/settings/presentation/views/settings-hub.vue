<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useIamStore } from '../../../iam/application/iam.store.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';

/**
 * Settings menu: Account settings, Get help, Upgrade plan (Administrator) and
 * Sign out. The same options appear in the Settings group of the side menu.
 */
const { t } = useI18n();
const router = useRouter();
const iamStore = useIamStore();

const options = computed(() => [
  { key: 'settings-account', to: '/app/settings/account', icon: 'pi pi-user-edit' },
  { key: 'settings-help', to: '/app/settings/help', icon: 'pi pi-question-circle' },
  { key: 'settings-plans', to: '/app/settings/plans', icon: 'pi pi-star', adminOnly: true },
].filter((option) => !option.adminOnly || iamStore.isAdmin));

function signOut() {
  iamStore.signOut();
  router.push({ name: 'sign-in' });
}
</script>

<template>
  <page-header :title="t('nav.settings')" :description="t('settings.hub.description')" />
  <ul class="settings-grid" :aria-label="t('nav.settings')">
    <li v-for="option in options" :key="option.key">
      <router-link :to="option.to" class="surface-card settings-option">
        <span class="settings-icon" aria-hidden="true"><i :class="option.icon" /></span>
        <span>
          <strong>{{ t(`nav.${option.key}`) }}</strong>
          <span class="option-text">{{ t(`settings.hub.${option.key}`) }}</span>
        </span>
        <i class="pi pi-angle-right option-arrow" aria-hidden="true" />
      </router-link>
    </li>
    <li>
      <button type="button" class="surface-card settings-option is-danger" @click="signOut">
        <span class="settings-icon" aria-hidden="true"><i class="pi pi-sign-out" /></span>
        <span>
          <strong>{{ t('nav.sign-out') }}</strong>
          <span class="option-text">{{ t('settings.hub.sign-out') }}</span>
        </span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.settings-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
.settings-option {
  width: 100%; height: 100%; display: flex; align-items: center; gap: 1rem; text-align: left;
  color: inherit; text-decoration: none; font: inherit; cursor: pointer;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.settings-option:hover { border-color: var(--color-accent); box-shadow: var(--shadow-md); }
.settings-option strong { display: block; color: var(--color-primary-dark); }
.option-text { display: block; font-size: .85rem; color: var(--color-muted); margin-top: .15rem; }
.option-arrow { margin-left: auto; color: var(--color-muted); }
.settings-option.is-danger strong { color: var(--color-danger); }
.settings-option.is-danger .settings-icon { background: var(--color-danger-bg); color: var(--color-danger); }
</style>
