<script setup>
import { computed, nextTick, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useIamStore } from '../../application/iam.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { PASSWORD_MIN_LENGTH, email, matches, minLength, required, strongPassword, validate } from '../../../shared/presentation/validation.js';
import AuthLayout from '../components/auth-layout.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';
import PasswordInput from '../../../shared/presentation/components/password-input.vue';

/**
 * Sign-up view: the restaurant owner creates the account and becomes the
 * first Administrator of the team.
 *
 * @remarks
 * Every field is mandatory. The password needs at least 8 characters with
 * letters and numbers and must be typed twice. Invalid fields raise a toast and
 * the focus moves to the first one.
 */
const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const iamStore = useIamStore();

const FIELD_IDS = {
  fullName: 'sign-up-full-name',
  restaurantName: 'sign-up-restaurant',
  email: 'sign-up-email',
  password: 'sign-up-password',
  confirmPassword: 'sign-up-confirm-password',
};

const form = reactive({ fullName: '', restaurantName: '', email: '', password: '', confirmPassword: '' });
const submitted = ref(false);
const loading = ref(false);
const errorMessage = ref(null);

const errors = computed(() => (submitted.value
  ? validate(form, {
    fullName: [required, minLength(3)],
    restaurantName: [required, minLength(2)],
    email: [email],
    password: [strongPassword],
    confirmPassword: [required, matches(() => form.password)],
  })
  : {}));
const highlights = computed(() => [t('auth.highlights.admin-role'), t('auth.highlights.invite-team'), t('auth.highlights.free-plan')]);

async function submit() {
  submitted.value = true;
  errorMessage.value = null;
  const fieldErrors = errors.value;
  const firstField = Object.keys(FIELD_IDS).find((field) => fieldErrors[field]);
  if (firstField) {
    const first = fieldErrors[firstField];
    toast.add({ severity: 'error', summary: t('auth.errors.check-fields'), detail: t(first.code, first.params ?? {}), life: 4500 });
    await nextTick();
    document.getElementById(FIELD_IDS[firstField])?.focus();
    return;
  }
  loading.value = true;
  try {
    await iamStore.signUp(form);
    toast.add({ severity: 'success', summary: t('auth.sign-up.welcome', { name: form.fullName.trim() }), life: 3000 });
    router.push({ name: 'dashboard' });
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'auth.sign-up.error');
    toast.add({ severity: 'error', summary: t('auth.errors.sign-up-failed'), detail: t(errorMessage.value.code, errorMessage.value.params), life: 5000 });
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
          <p class="required-legend">{{ t('fields.required-legend') }}</p>
          <pv-message v-if="errorMessage" severity="error" class="mb-3" role="alert">{{ t(errorMessage.code, errorMessage.params) }}</pv-message>

          <form-field :id="FIELD_IDS.fullName" :label="t('fields.full-name')" :error="errors.fullName" required>
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.fullName" autocomplete="name" :placeholder="t('placeholders.full-name')"
                :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" aria-required="true" />
            </template>
          </form-field>

          <form-field :id="FIELD_IDS.restaurantName" :label="t('fields.restaurant-name')" :error="errors.restaurantName" required>
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.restaurantName" autocomplete="organization" :placeholder="t('placeholders.restaurant-name')"
                :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" aria-required="true" />
            </template>
          </form-field>

          <form-field :id="FIELD_IDS.email" :label="t('fields.email')" :error="errors.email" required>
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.email" type="email" autocomplete="email" :placeholder="t('placeholders.email')"
                :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" aria-required="true" />
            </template>
          </form-field>

          <form-field :id="FIELD_IDS.password" :label="t('fields.password')" :error="errors.password"
            :hint="t('auth.password-rule', { min: PASSWORD_MIN_LENGTH })" required>
            <template #default="{ id, describedBy, invalid }">
              <password-input :id="id" v-model="form.password" autocomplete="new-password" :invalid="invalid" :described-by="describedBy" required />
            </template>
          </form-field>

          <form-field :id="FIELD_IDS.confirmPassword" :label="t('fields.confirm-password')" :error="errors.confirmPassword" required>
            <template #default="{ id, describedBy, invalid }">
              <password-input :id="id" v-model="form.confirmPassword" autocomplete="new-password" :invalid="invalid" :described-by="describedBy" required />
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
.auth-card { width: 100%; max-width: 420px; }
.auth-title { font-size: 1.4rem; margin: 0; }
.required-legend { font-size: .8rem; margin-bottom: 1rem; }
.switch-link { text-align: center; font-size: .9rem; margin: 1rem 0 0; }
.switch-link a { color: var(--color-accent-strong); font-weight: 700; }
</style>
