<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useIamStore } from '../../application/iam.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { email, minLength, required, validate } from '../../../shared/presentation/validation.js';
import AuthLayout from '../components/auth-layout.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';

/**
 * Sign-up view: the restaurant owner creates the account and becomes the
 * first Administrator of the team.
 */
const { t } = useI18n();
const router = useRouter();
const iamStore = useIamStore();

const form = reactive({ fullName: '', restaurantName: '', email: '', password: '' });
const submitted = ref(false);
const loading = ref(false);
const errorMessage = ref(null);

const errors = computed(() => (submitted.value
  ? validate(form, { fullName: [required, minLength(3)], restaurantName: [required], email: [email], password: [required, minLength(4)] })
  : {}));
const highlights = computed(() => [t('auth.highlights.admin-role'), t('auth.highlights.invite-team'), t('auth.highlights.free-plan')]);

async function submit() {
  submitted.value = true;
  if (Object.keys(errors.value).length > 0) return;
  loading.value = true;
  errorMessage.value = null;
  try {
    await iamStore.signUp(form);
    router.push({ name: 'dashboard' });
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'auth.sign-up.error');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <auth-layout :headline="t('auth.sign-up.headline')" :description="t('auth.sign-up.description')" :highlights="highlights">
    <pv-card class="auth-card">
      <template #title><h1 class="auth-title">{{ t('auth.sign-up.title') }}</h1></template>
      <template #subtitle>{{ t('auth.sign-up.subtitle') }}</template>
      <template #content>
        <form novalidate :aria-label="t('auth.sign-up.title')" @submit.prevent="submit">
          <pv-message v-if="errorMessage" severity="error" class="mb-3" role="alert">{{ t(errorMessage.code, errorMessage.params) }}</pv-message>

          <form-field id="sign-up-full-name" :label="t('fields.full-name')" :error="errors.fullName">
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.fullName" autocomplete="name" :placeholder="t('placeholders.full-name')"
                :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
            </template>
          </form-field>

          <form-field id="sign-up-restaurant" :label="t('fields.restaurant-name')" :error="errors.restaurantName">
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.restaurantName" autocomplete="organization" :placeholder="t('placeholders.restaurant-name')"
                :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
            </template>
          </form-field>

          <form-field id="sign-up-email" :label="t('fields.email')" :error="errors.email">
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.email" type="email" autocomplete="email" :placeholder="t('placeholders.email')"
                :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
            </template>
          </form-field>

          <form-field id="sign-up-password" :label="t('fields.password')" :error="errors.password" :hint="t('auth.password-rule')">
            <template #default="{ id, describedBy, invalid }">
              <pv-password v-model="form.password" :input-id="id" :feedback="false" toggle-mask autocomplete="new-password"
                :invalid="invalid" :input-props="{ 'aria-invalid': invalid, 'aria-describedby': describedBy, 'aria-expanded': null, 'aria-haspopup': null }" />
            </template>
          </form-field>

          <pv-button type="submit" class="w-full mt-2" :label="loading ? t('auth.sign-up.submitting') : t('auth.sign-up.submit')" :loading="loading" />
          <p class="switch-link">
            {{ t('auth.sign-up.has-account') }}
            <router-link :to="{ name: 'sign-in' }">{{ t('auth.sign-up.go-to-sign-in') }}</router-link>
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
