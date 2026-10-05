<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useIamStore } from '../../application/iam.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { email, minLength, optionalMinLength, required, validate } from '../../../shared/presentation/validation.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';

/**
 * Profile view: the signed-in user edits their account and restaurant data.
 */
const { t } = useI18n();
const toast = useToast();
const iamStore = useIamStore();

const user = computed(() => iamStore.currentUser);
const form = reactive({
  fullName: user.value?.fullName ?? '',
  restaurantName: user.value?.restaurantName ?? '',
  email: user.value?.email ?? '',
  password: '',
});
const submitted = ref(false);
const saving = ref(false);
const errorMessage = ref(null);

const errors = computed(() => (submitted.value
  ? validate(form, { fullName: [required, minLength(3)], restaurantName: [required], email: [email], password: [optionalMinLength(4)] })
  : {}));

async function submit() {
  submitted.value = true;
  if (Object.keys(errors.value).length > 0) return;
  saving.value = true;
  errorMessage.value = null;
  try {
    await iamStore.updateProfile({ ...form, password: form.password || undefined });
    form.password = '';
    submitted.value = false;
    toast.add({ severity: 'success', summary: t('profile.saved'), life: 2500 });
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'profile.error');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <page-header :title="t('profile.title')" :description="t('profile.description')" />

  <section class="surface-card profile-card" :aria-label="t('profile.title')">
    <div class="flex align-items-center gap-3 mb-4">
      <pv-avatar :label="(user?.fullName || '?').charAt(0).toUpperCase()" size="large" shape="circle" class="profile-avatar" aria-hidden="true" />
      <div>
        <strong class="block">{{ user?.fullName }}</strong>
        <pv-tag :value="user ? t(`iam.roles.${user.role}`) : ''" severity="secondary" />
      </div>
    </div>

    <pv-message v-if="errorMessage" severity="error" class="mb-3" role="alert">{{ t(errorMessage.code, errorMessage.params) }}</pv-message>

    <form novalidate @submit.prevent="submit">
      <form-field id="profile-full-name" :label="t('fields.full-name')" :error="errors.fullName">
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="form.fullName" autocomplete="name" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
      <form-field id="profile-restaurant" :label="t('fields.restaurant-name')" :error="errors.restaurantName">
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="form.restaurantName" autocomplete="organization" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
      <form-field id="profile-email" :label="t('fields.email')" :error="errors.email">
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="form.email" type="email" autocomplete="email" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
      <form-field id="profile-password" :label="t('profile.new-password')" :error="errors.password" :hint="t('profile.password-hint')">
        <template #default="{ id, describedBy, invalid }">
          <pv-password v-model="form.password" :input-id="id" :feedback="false" toggle-mask autocomplete="new-password"
            :invalid="invalid" :input-props="{ 'aria-invalid': invalid, 'aria-describedby': describedBy, 'aria-expanded': null, 'aria-haspopup': null }" />
        </template>
      </form-field>
      <pv-button type="submit" icon="pi pi-save" :label="saving ? t('common.saving') : t('common.save-changes')" :loading="saving" />
    </form>
  </section>
</template>

<style scoped>
.profile-card { max-width: 540px; }
.profile-avatar { background: var(--color-primary-light); color: #fff; font-weight: 800; }
</style>
