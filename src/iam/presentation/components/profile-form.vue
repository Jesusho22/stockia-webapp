<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useIamStore } from '../../application/iam.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { email, minLength, required, validate } from '../../../shared/presentation/validation.js';
import FormField from '../../../shared/presentation/components/form-field.vue';

/**
 * Account settings › Profile data: full name and email of the signed-in user.
 */
const { t } = useI18n();
const toast = useToast();
const iamStore = useIamStore();

const user = computed(() => iamStore.currentUser);
const form = reactive({ fullName: user.value?.fullName ?? '', email: user.value?.email ?? '' });
const submitted = ref(false);
const saving = ref(false);

const errors = computed(() => (submitted.value ? validate(form, { fullName: [required, minLength(3)], email: [email] }) : {}));

async function submit() {
  submitted.value = true;
  const first = Object.values(errors.value)[0];
  if (first) {
    toast.add({ severity: 'error', summary: t('auth.errors.check-fields'), detail: t(first.code, first.params ?? {}), life: 4000 });
    return;
  }
  saving.value = true;
  try {
    await iamStore.updateProfile(form);
    submitted.value = false;
    toast.add({ severity: 'success', summary: t('settings.profile.saved'), life: 2500 });
  } catch (error) {
    const { code, params } = toErrorMessage(error, 'settings.profile.error');
    toast.add({ severity: 'error', summary: t('settings.profile.error'), detail: t(code, params), life: 4500 });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="surface-card settings-card" aria-labelledby="settings-profile-title">
    <header class="settings-card-header">
      <span class="settings-icon" aria-hidden="true"><i class="pi pi-user" /></span>
      <div>
        <h2 id="settings-profile-title">{{ t('settings.profile.title') }}</h2>
        <p>{{ t('settings.profile.description') }}</p>
      </div>
    </header>
    <div class="flex align-items-center gap-3 mb-3">
      <pv-avatar :label="(user?.fullName || '?').charAt(0).toUpperCase()" size="large" shape="circle" class="profile-avatar" aria-hidden="true" />
      <div>
        <strong class="block">{{ user?.fullName }}</strong>
        <pv-tag :value="user ? t(`iam.roles.${user.role}`) : ''" severity="secondary" />
      </div>
    </div>
    <form novalidate @submit.prevent="submit">
      <form-field id="settings-full-name" :label="t('fields.full-name')" :error="errors.fullName" required>
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="form.fullName" autocomplete="name" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" aria-required="true" />
        </template>
      </form-field>
      <form-field id="settings-email" :label="t('fields.email')" :error="errors.email" required>
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="form.email" type="email" autocomplete="email" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" aria-required="true" />
        </template>
      </form-field>
      <pv-button type="submit" icon="pi pi-save" :label="saving ? t('common.saving') : t('common.save-changes')" :loading="saving" />
    </form>
  </section>
</template>

<style scoped>
.profile-avatar { background: var(--color-primary-light); color: #fff; font-weight: 800; }
</style>
