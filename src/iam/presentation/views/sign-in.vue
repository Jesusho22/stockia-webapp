<script setup>
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useIamStore } from '../../application/iam.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { email, minLength, required, validate } from '../../../shared/presentation/validation.js';
import AuthLayout from '../components/auth-layout.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';

/**
 * Sign-in view of the User & Access Management Bounded Context.
 */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();

// Demo credentials preloaded in the mock API (also shown in the hint below).
const form = reactive({ email: 'admin@databitecorp.com', password: 'stockia123' });
const submitted = ref(false);
const loading = ref(false);
const errorMessage = ref(null);

const errors = computed(() => (submitted.value ? validate(form, { email: [email], password: [required, minLength(4)] }) : {}));
const highlights = computed(() => [t('auth.highlights.deduction'), t('auth.highlights.forecast'), t('auth.highlights.alerts')]);

async function submit() {
  submitted.value = true;
  if (Object.keys(errors.value).length > 0) return;
  loading.value = true;
  errorMessage.value = null;
  try {
    await iamStore.signIn(form.email, form.password);
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/app') ? route.query.redirect : '/app/dashboard';
    router.push(redirect);
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'errors.network');
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
          <pv-message v-if="errorMessage" severity="error" class="mb-3" role="alert">{{ t(errorMessage.code, errorMessage.params) }}</pv-message>

          <form-field id="sign-in-email" :label="t('fields.email')" :error="errors.email">
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.email" type="email" autocomplete="email" :placeholder="t('placeholders.email')"
                :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
            </template>
          </form-field>

          <form-field id="sign-in-password" :label="t('fields.password')" :error="errors.password" :hint="t('auth.sign-in.demo-hint')">
            <template #default="{ id, describedBy, invalid }">
              <pv-password v-model="form.password" :input-id="id" :feedback="false" toggle-mask autocomplete="current-password"
                :invalid="invalid" :input-props="{ 'aria-invalid': invalid, 'aria-describedby': describedBy, 'aria-expanded': null, 'aria-haspopup': null }" />
            </template>
          </form-field>

          <pv-button type="submit" class="w-full mt-2" :label="loading ? t('auth.sign-in.submitting') : t('auth.sign-in.submit')" :loading="loading" />
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
.switch-link { text-align: center; font-size: .9rem; margin: 1rem 0 0; }
.switch-link a { color: var(--color-accent-strong); font-weight: 700; }
</style>
