<script setup>
import { computed, nextTick, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { INVITATION_TEMPORARY_PASSWORD, useIamStore } from '../../application/iam.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { email, required, validate } from '../../../shared/presentation/validation.js';
import AuthLayout from '../components/auth-layout.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';
import PasswordInput from '../../../shared/presentation/components/password-input.vue';

/**
 * Sign-in view of the User & Access Management Bounded Context.
 *
 * @remarks
 * Email and password are mandatory. When a field is wrong (e.g. an invalid
 * email) or the credentials are rejected, a toast explains why and the focus
 * moves to the first field to fix.
 */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const iamStore = useIamStore();

const DEMO_ACCOUNTS = {
  admin: 'admin@databitecorp.com',
  employee: 'empleado@databitecorp.com',
};

const form = reactive({ email: '', password: '' });
const submitted = ref(false);
const loading = ref(false);
const errorMessage = ref(null);

const errors = computed(() => (submitted.value ? validate(form, { email: [email], password: [required] }) : {}));
const highlights = computed(() => [t('auth.highlights.deduction'), t('auth.highlights.forecast'), t('auth.highlights.alerts')]);

/** @param {'admin'|'employee'} account */
function useDemo(account) {
  Object.assign(form, { email: DEMO_ACCOUNTS[account], password: INVITATION_TEMPORARY_PASSWORD });
  errorMessage.value = null;
}

async function focusFirstError() {
  await nextTick();
  const field = errors.value.email ? 'sign-in-email' : 'sign-in-password';
  document.getElementById(field)?.focus();
}

async function submit() {
  submitted.value = true;
  errorMessage.value = null;
  const fieldErrors = errors.value;
  if (Object.keys(fieldErrors).length > 0) {
    const first = fieldErrors.email ?? fieldErrors.password;
    toast.add({ severity: 'error', summary: t('auth.errors.check-fields'), detail: t(first.code, first.params ?? {}), life: 4500 });
    focusFirstError();
    return;
  }
  loading.value = true;
  try {
    await iamStore.signIn(form.email, form.password);
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/app') ? route.query.redirect : '/app/dashboard';
    router.push(redirect);
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'errors.network');
    toast.add({ severity: 'error', summary: t('auth.errors.access-denied'), detail: t(errorMessage.value.code, errorMessage.value.params), life: 5000 });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <auth-layout :headline="t('auth.sign-in.headline')" :description="t('auth.sign-in.description')" :highlights="highlights">
    <pv-card class="auth-card">
      <template #title><h1 class="auth-title">{{ t('auth.sign-in.title') }}</h1></template>
      <template #subtitle>{{ t('auth.sign-in.subtitle') }}</template>
      <template #content>
        <form novalidate :aria-label="t('auth.sign-in.title')" @submit.prevent="submit">
          <p class="required-legend">{{ t('fields.required-legend') }}</p>
          <pv-message v-if="errorMessage" severity="error" class="mb-3" role="alert">{{ t(errorMessage.code, errorMessage.params) }}</pv-message>

          <form-field id="sign-in-email" :label="t('fields.email')" :error="errors.email" required>
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.email" type="email" autocomplete="email" :placeholder="t('placeholders.email')"
                :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" aria-required="true" />
            </template>
          </form-field>

          <form-field id="sign-in-password" :label="t('fields.password')" :error="errors.password" required>
            <template #default="{ id, describedBy, invalid }">
              <password-input :id="id" v-model="form.password" autocomplete="current-password" :placeholder="t('placeholders.password')"
                :invalid="invalid" :described-by="describedBy" required />
            </template>
          </form-field>

          <pv-button type="submit" class="w-full mt-2" :label="loading ? t('auth.sign-in.submitting') : t('auth.sign-in.submit')" :loading="loading" />

          <div class="demo-box">
            <p class="demo-title"><i class="pi pi-info-circle" aria-hidden="true" /> {{ t('auth.sign-in.demo-title') }}</p>
            <div class="demo-actions">
              <pv-button type="button" size="small" outlined icon="pi pi-shield" :label="t('iam.roles.ADMIN')" @click="useDemo('admin')" />
              <pv-button type="button" size="small" outlined icon="pi pi-user" :label="t('iam.roles.EMPLOYEE')" @click="useDemo('employee')" />
            </div>
          </div>

          <p class="switch-link">
            {{ t('auth.sign-in.no-account') }}
            <router-link :to="{ name: 'sign-up' }">{{ t('auth.sign-in.go-to-sign-up') }}</router-link>
          </p>
        </form>
      </template>
    </pv-card>
  </auth-layout>
</template>

<style scoped>
.auth-card { width: 100%; max-width: 400px; }
.auth-title { font-size: 1.4rem; margin: 0; }
.required-legend { font-size: .8rem; margin-bottom: 1rem; }
.demo-box { margin-top: 1rem; padding: .75rem; border: 1px dashed var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); }
.demo-title { font-size: .8rem; margin-bottom: .5rem; }
.demo-actions { display: flex; gap: .5rem; flex-wrap: wrap; }
.switch-link { text-align: center; font-size: .9rem; margin: 1rem 0 0; }
.switch-link a { color: var(--color-accent-strong); font-weight: 700; }
</style>
