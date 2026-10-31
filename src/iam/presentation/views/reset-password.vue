<script setup>
import { computed, nextTick, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useIamStore } from '../../application/iam.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { PASSWORD_MIN_LENGTH, email, matches, required, strongPassword, validate } from '../../../shared/presentation/validation.js';
import { notify } from '../../../shared/application/notifications.js';
import AuthLayout from '../components/auth-layout.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';
import PasswordInput from '../../../shared/presentation/components/password-input.vue';

/**
 * Recovery link of the password email (/auth/reset-password?email=…&code=…):
 * sets a new password with the 6-digit code. It also unlocks an account
 * locked by wrong passwords.
 */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const iamStore = useIamStore();

const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  code: typeof route.query.code === 'string' ? route.query.code : '',
  newPassword: '',
  confirmPassword: '',
});
const submitted = ref(false);
const loading = ref(false);
const errorMessage = ref(null);

const sixDigits = (value) => (/^\d{6}$/.test(String(value ?? '').trim()) ? null : { code: 'auth.reset.code-invalid' });
const errors = computed(() => (submitted.value
  ? validate(form, {
    email: [email], code: [sixDigits], newPassword: [strongPassword], confirmPassword: [required, matches(() => form.newPassword)],
  })
  : {}));
const highlights = computed(() => [t('auth.forgot.highlights.expires'), t('auth.forgot.highlights.unlock')]);
const FIELD_IDS = { email: 'reset-email', code: 'reset-code', newPassword: 'reset-new-password', confirmPassword: 'reset-confirm-password' };

async function submit() {
  submitted.value = true;
  errorMessage.value = null;
  const firstField = Object.keys(FIELD_IDS).find((field) => errors.value[field]);
  if (firstField) {
    const first = errors.value[firstField];
    toast.add({ severity: 'error', summary: t('auth.errors.check-fields'), detail: t(first.code, first.params ?? {}), life: 4500 });
    await nextTick();
    document.getElementById(FIELD_IDS[firstField])?.focus();
    return;
  }
  loading.value = true;
  try {
    await iamStore.resetPassword(form);
    notify({ severity: 'success', summary: 'auth.reset.done', detail: 'auth.reset.done-detail' });
    router.push({ name: 'sign-in' });
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'errors.network');
    toast.add({ severity: 'error', summary: t('auth.reset.error'), detail: t(errorMessage.value.code, errorMessage.value.params), life: 5000 });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <auth-layout :headline="t('auth.reset.headline')" :description="t('auth.reset.description')" :highlights="highlights">
    <pv-card class="auth-card">
      <template #title><h1 class="auth-title">{{ t('auth.reset.title') }}</h1></template>
      <template #content>
        <form novalidate :aria-label="t('auth.reset.title')" @submit.prevent="submit">
          <pv-message v-if="errorMessage" severity="error" class="mb-3" role="alert">{{ t(errorMessage.code, errorMessage.params) }}</pv-message>
          <form-field id="reset-email" :label="t('fields.email')" :error="errors.email" required>
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.email" type="email" autocomplete="email" :invalid="invalid" :aria-invalid="invalid"
                :aria-describedby="describedBy" aria-required="true" />
            </template>
          </form-field>
          <form-field id="reset-code" :label="t('auth.reset.code')" :error="errors.code" required>
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" :invalid="invalid"
                :aria-invalid="invalid" :aria-describedby="describedBy" aria-required="true" />
            </template>
          </form-field>
          <form-field id="reset-new-password" :label="t('auth.reset.new-password')" :error="errors.newPassword"
            :hint="t('auth.password-rule', { min: PASSWORD_MIN_LENGTH })" required>
            <template #default="{ id, describedBy, invalid }">
              <password-input :id="id" v-model="form.newPassword" autocomplete="new-password" :invalid="invalid" :described-by="describedBy" required />
            </template>
          </form-field>
          <form-field id="reset-confirm-password" :label="t('auth.reset.confirm-password')" :error="errors.confirmPassword" required>
            <template #default="{ id, describedBy, invalid }">
              <password-input :id="id" v-model="form.confirmPassword" autocomplete="new-password" :invalid="invalid" :described-by="describedBy" required />
            </template>
          </form-field>
          <pv-button type="submit" class="w-full mt-2" icon="pi pi-check" :label="t('auth.reset.submit')" :loading="loading" />
          <p class="switch-link"><router-link :to="{ name: 'forgot-password' }">{{ t('auth.reset.new-link') }}</router-link></p>
        </form>
      </template>
    </pv-card>
  </auth-layout>
</template>

<style scoped>
.auth-card { width: 100%; max-width: 400px; }
.auth-title { font-size: 1.4rem; margin: 0; }
.switch-link { text-align: center; font-size: .9rem; margin: 1rem 0 0; }
.switch-link a { color: var(--color-accent-strong); font-weight: 700; }
</style>
