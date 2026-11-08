<script setup>
import { computed, nextTick, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useIamStore } from '../../application/iam.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { email, validate } from '../../../shared/presentation/validation.js';
import AuthLayout from '../components/auth-layout.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';

/**
 * "Forgot your password?" (Password Reset Service of Identity & Access
 * Management): the API emails a recovery link. The answer is the same whether
 * the email is registered or not. While the email provider is simulated (demo),
 * the API also returns a copy of the email so the link can be opened here.
 */
const { t } = useI18n();
const toast = useToast();
const iamStore = useIamStore();

const form = reactive({ email: '' });
const submitted = ref(false);
const loading = ref(false);
const sent = ref(null);

const errors = computed(() => (submitted.value ? validate(form, { email: [email] }) : {}));
const highlights = computed(() => [t('auth.forgot.highlights.link'), t('auth.forgot.highlights.expires'), t('auth.forgot.highlights.unlock')]);
/** Path of the simulated link inside this Web App (it may come with another host). */
const demoPath = computed(() => {
  const link = sent.value?.simulatedEmail?.resetLink;
  if (!link) return null;
  const url = new URL(link, window.location.origin);
  return `${url.pathname}${url.search}`;
});

async function submit() {
  submitted.value = true;
  if (errors.value.email) {
    toast.add({ severity: 'error', summary: t('auth.errors.check-fields'), detail: t(errors.value.email.code), life: 4000 });
    await nextTick();
    document.getElementById('forgot-email')?.focus();
    return;
  }
  loading.value = true;
  try {
    sent.value = await iamStore.requestPasswordReset(form.email);
  } catch (error) {
    const { code, params } = toErrorMessage(error, 'errors.network');
    toast.add({ severity: 'error', summary: t('auth.forgot.error'), detail: t(code, params), life: 5000 });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <auth-layout :headline="t('auth.forgot.headline')" :description="t('auth.forgot.description')" :highlights="highlights">
    <pv-card class="auth-card">
      <template #title><h1 class="auth-title">{{ t('auth.forgot.title') }}</h1></template>
      <template #subtitle>{{ t('auth.forgot.subtitle') }}</template>
      <template #content>
        <div v-if="sent" class="sent-box" role="status">
          <pv-message severity="success" :closable="false">{{ t('auth.forgot.sent', { email: sent.sentTo }) }}</pv-message>
          <div v-if="sent.simulatedEmail" class="demo-mail" data-testid="simulated-email">
            <p class="demo-title"><i class="pi pi-envelope" aria-hidden="true" /> {{ t('auth.forgot.demo-title') }}</p>
            <p class="demo-subject">{{ sent.simulatedEmail.subject }}</p>
            <p class="demo-code">{{ t('auth.forgot.demo-code', { code: sent.simulatedEmail.code }) }}</p>
            <router-link v-if="demoPath" :to="demoPath" class="p-button p-component p-button-sm demo-link">
              {{ t('auth.forgot.open-link') }}
            </router-link>
          </div>
          <p class="switch-link"><router-link :to="{ name: 'sign-in' }">{{ t('auth.forgot.back') }}</router-link></p>
        </div>

        <form v-else novalidate :aria-label="t('auth.forgot.title')" @submit.prevent="submit">
          <form-field id="forgot-email" :label="t('fields.email')" :error="errors.email" required>
            <template #default="{ id, describedBy, invalid }">
              <pv-input-text :id="id" v-model="form.email" type="email" autocomplete="email" :placeholder="t('placeholders.email')"
                :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" aria-required="true" />
            </template>
          </form-field>
          <pv-button type="submit" class="w-full mt-2" icon="pi pi-send" :label="t('auth.forgot.submit')" :loading="loading" />
          <p class="switch-link"><router-link :to="{ name: 'sign-in' }">{{ t('auth.forgot.back') }}</router-link></p>
        </form>
      </template>
    </pv-card>
  </auth-layout>
</template>

<style scoped>
.auth-card { width: 100%; max-width: 400px; }
.auth-title { font-size: 1.4rem; margin: 0; }
.demo-mail { margin-top: 1rem; padding: .75rem; border: 1px dashed var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); }
.demo-title { font-size: .8rem; margin: 0 0 .4rem; font-weight: 700; }
.demo-subject { font-size: .85rem; margin: 0 0 .25rem; }
.demo-code { font-size: .85rem; margin: 0 0 .75rem; }
.demo-link { text-decoration: none; }
.switch-link { text-align: center; font-size: .9rem; margin: 1rem 0 0; }
.switch-link a { color: var(--color-accent-strong); font-weight: 700; }
</style>
