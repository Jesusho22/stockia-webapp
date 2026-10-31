<script setup>
import { useI18n } from 'vue-i18n';
import { useIamStore } from '../../application/iam.store.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';
import ProfileForm from '../components/profile-form.vue';
import RestaurantForm from '../../../restaurant-registration/presentation/components/restaurant-form.vue';
import ChangePasswordForm from '../components/change-password-form.vue';
import SubscriptionSummary from '../../../subscription-payments/presentation/components/subscription-summary.vue';

/**
 * Settings › Account settings: profile data, subscription type
 * (Administrator only), restaurant data and password change.
 *
 * @remarks
 * Composition view: each card belongs to its Bounded Context (IAM or
 * Subscription & Payments) and talks only to its own store.
 */
const { t } = useI18n();
const iamStore = useIamStore();
</script>

<template>
  <page-header :title="t('nav.settings-account')" :description="t('settings.account.description')" />
  <div class="settings-columns">
    <div class="settings-column">
      <profile-form />
      <change-password-form />
    </div>
    <div class="settings-column">
      <subscription-summary v-if="iamStore.isAdmin" />
      <restaurant-form />
    </div>
  </div>
</template>

<style scoped>
.settings-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; align-items: start; }
.settings-column { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }
@media (max-width: 400px) {
  .settings-columns { grid-template-columns: 1fr; }
}
</style>
