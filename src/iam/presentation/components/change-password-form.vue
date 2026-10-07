<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useIamStore } from '../../application/iam.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { PASSWORD_MIN_LENGTH, matches, required, strongPassword, validate } from '../../../shared/presentation/validation.js';
import FormField from '../../../shared/presentation/components/form-field.vue';
import PasswordInput from '../../../shared/presentation/components/password-input.vue';

/**
 * Account settings › Change password. The current password is verified
 * before saving the new one, which must be typed twice.
 */
const { t } = useI18n();
const toast = useToast();
const iamStore = useIamStore();

const emptyForm = () => ({ currentPassword: '', newPassword: '', confirmPassword: '' });
const form = reactive(emptyForm());
const submitted = ref(false);
const saving = ref(false);
const errorMessage = ref(null);

const errors = computed(() => (submitted.value
  ? validate(form, {
    currentPassword: [required],
    newPassword: [strongPassword],
    confirmPassword: [required, matches(() => form.newPassword)],
  })
  : {}));

async function submit() {
  submitted.value = true;
  errorMessage.value = null;
  const first = Object.values(errors.value)[0];
  if (first) {
    toast.add({ severity: 'error', summary: t('auth.errors.check-fields'), detail: t(first.code, first.params ?? {}), life: 4000 });
    return;
  }
  saving.value = true;
  try {
    await iamStore.changePassword(form);
    Object.assign(form, emptyForm());
    submitted.value = false;
    toast.add({ severity: 'success', summary: t('settings.password.saved'), life: 3000 });
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'settings.password.error');
    toast.add({ severity: 'error', summary: t('settings.password.error'), detail: t(errorMessage.value.code, errorMessage.value.params), life: 4500 });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="surface-card settings-card" aria-labelledby="settings-password-title">
    <header class="settings-card-header">
      <span class="settings-icon" aria-hidden="true"><i class="pi pi-lock" /></span>
      <div>
        <h2 id="settings-password-title">{{ t('settings.password.title') }}</h2>
        <p>{{ t('settings.password.description') }}</p>
      </div>
    </header>
    <pv-message v-if="errorMessage" severity="error" class="mb-3" role="alert">{{ t(errorMessage.code, errorMessage.params) }}</pv-message>
    <form novalidate @submit.prevent="submit">
      <form-field id="settings-current-password" :label="t('settings.password.current')" :error="errors.currentPassword" required>
        <template #default="{ id, describedBy, invalid }">
          <password-input :id="id" v-model="form.currentPassword" autocomplete="current-password" :invalid="invalid" :described-by="describedBy" required />
        </template>
      </form-field>
      <form-field id="settings-new-password" :label="t('settings.password.new')" :error="errors.newPassword"
        :hint="t('auth.password-rule', { min: PASSWORD_MIN_LENGTH })" required>
        <template #default="{ id, describedBy, invalid }">
          <password-input :id="id" v-model="form.newPassword" autocomplete="new-password" :invalid="invalid" :described-by="describedBy" required />
        </template>
      </form-field>
      <form-field id="settings-confirm-password" :label="t('fields.confirm-password')" :error="errors.confirmPassword" required>
        <template #default="{ id, describedBy, invalid }">
          <password-input :id="id" v-model="form.confirmPassword" autocomplete="new-password" :invalid="invalid" :described-by="describedBy" required />
        </template>
      </form-field>
      <pv-button type="submit" icon="pi pi-key" :label="saving ? t('common.saving') : t('settings.password.submit')" :loading="saving" />
    </form>
  </section>
</template>
