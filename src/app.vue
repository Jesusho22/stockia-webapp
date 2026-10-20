<script setup>
import { onBeforeUnmount, onMounted, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { drainNotifications, notificationQueue, notify } from './shared/application/notifications.js';
import { SESSION_EXPIRED_EVENT } from './shared/infrastructure/base-api.js';
import { useIamStore } from './iam/application/iam.store.js';

/**
 * Presentation shell component.
 *
 * @remarks
 * Hosts the routed views plus the global toast and confirmation outlets, and
 * keeps the document language in sync with the active locale (WCAG 3.1.1).
 * Notifications raised outside components (router guards) are shown here as
 * toasts, e.g. "You do not have access to this section". When the API rejects
 * the token (expired session) the user is signed out and sent to sign-in.
 */
const { locale, t } = useI18n();
const toast = useToast();
const router = useRouter();
const iamStore = useIamStore();

function onSessionExpired() {
  if (!iamStore.isAuthenticated) return;
  iamStore.signOut();
  notify({ severity: 'warn', summary: 'access.session-expired', detail: 'access.session-required-detail' });
  router.push({ name: 'sign-in', query: { redirect: router.currentRoute.value.fullPath } });
}

onMounted(() => window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired));
onBeforeUnmount(() => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired));

watchEffect(() => {
  document.documentElement.lang = locale.value;
  document.title = t('app.document-title');
});

watch(
  () => notificationQueue.items.length,
  (length) => {
    if (length === 0) return;
    for (const notification of drainNotifications()) {
      toast.add({
        severity: notification.severity,
        summary: t(notification.summary, notification.params ?? {}),
        detail: notification.detail ? t(notification.detail, notification.params ?? {}) : undefined,
        life: 4500,
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <a class="skip-link" href="#main-content">{{ t('app.skip-to-content') }}</a>
  <router-view />
  <pv-toast position="top-right" />
  <!-- Confirmation dialog with a highlighted icon, the item name and a warning line. -->
  <pv-confirm-dialog class="stockia-confirm" :breakpoints="{ '640px': '92vw' }" :style="{ width: '27rem' }">
    <template #message="{ message }">
      <div class="confirm-body">
        <span class="confirm-icon" :class="`is-${message.tone ?? 'danger'}`" aria-hidden="true">
          <i :class="message.icon ?? 'pi pi-trash'" />
        </span>
        <p class="confirm-message">{{ message.message }}</p>
        <p v-if="message.itemName" class="confirm-item">
          <i class="pi pi-box" aria-hidden="true" />
          <strong>{{ message.itemName }}</strong>
        </p>
        <p v-if="message.detail" class="confirm-detail">{{ message.detail }}</p>
      </div>
    </template>
  </pv-confirm-dialog>
</template>
