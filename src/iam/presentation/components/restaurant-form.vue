<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useIamStore } from '../../application/iam.store.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { minLength, optionalPhone, required, validate } from '../../../shared/presentation/validation.js';
import FormField from '../../../shared/presentation/components/form-field.vue';

/**
 * Account settings › Restaurant data. The Administrator edits it; an Employee
 * only reads it.
 */
const { t } = useI18n();
const toast = useToast();
const iamStore = useIamStore();

const user = computed(() => iamStore.currentUser);
const readOnly = computed(() => !iamStore.isAdmin);
const form = reactive({
  restaurantName: user.value?.restaurantName ?? '',
  restaurantAddress: user.value?.restaurantAddress ?? '',
  restaurantPhone: user.value?.restaurantPhone ?? '',
});
const submitted = ref(false);
const saving = ref(false);

const errors = computed(() => (submitted.value
  ? validate(form, { restaurantName: [required, minLength(2)], restaurantPhone: [optionalPhone] })
  : {}));

async function submit() {
  submitted.value = true;
  const first = Object.values(errors.value)[0];
  if (first) {
    toast.add({ severity: 'error', summary: t('auth.errors.check-fields'), detail: t(first.code, first.params ?? {}), life: 4000 });
    return;
  }
  saving.value = true;
  try {
    await iamStore.updateRestaurant(form);
    submitted.value = false;
    toast.add({ severity: 'success', summary: t('settings.restaurant.saved'), life: 2500 });
  } catch (error) {
    const { code, params } = toErrorMessage(error, 'settings.restaurant.error');
    toast.add({ severity: 'error', summary: t('settings.restaurant.error'), detail: t(code, params), life: 4500 });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="surface-card settings-card" aria-labelledby="settings-restaurant-title">
    <header class="settings-card-header">
      <span class="settings-icon" aria-hidden="true"><i class="pi pi-building" /></span>
      <div>
        <h2 id="settings-restaurant-title">{{ t('settings.restaurant.title') }}</h2>
        <p>{{ readOnly ? t('settings.restaurant.read-only') : t('settings.restaurant.description') }}</p>
      </div>
    </header>

    <dl v-if="readOnly" class="data-list">
      <div><dt>{{ t('fields.restaurant-name') }}</dt><dd>{{ user?.restaurantName || '—' }}</dd></div>
      <div><dt>{{ t('fields.restaurant-address') }}</dt><dd>{{ user?.restaurantAddress || '—' }}</dd></div>
      <div><dt>{{ t('fields.restaurant-phone') }}</dt><dd>{{ user?.restaurantPhone || '—' }}</dd></div>
    </dl>

    <form v-else novalidate @submit.prevent="submit">
      <form-field id="settings-restaurant-name" :label="t('fields.restaurant-name')" :error="errors.restaurantName" required>
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="form.restaurantName" autocomplete="organization" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" aria-required="true" />
        </template>
      </form-field>
      <form-field id="settings-restaurant-address" :label="t('fields.restaurant-address')">
        <template #default="{ id, describedBy }">
          <pv-input-text :id="id" v-model="form.restaurantAddress" autocomplete="street-address" :placeholder="t('placeholders.restaurant-address')" :aria-describedby="describedBy" />
        </template>
      </form-field>
      <form-field id="settings-restaurant-phone" :label="t('fields.restaurant-phone')" :error="errors.restaurantPhone">
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="form.restaurantPhone" type="tel" autocomplete="tel" :placeholder="t('placeholders.restaurant-phone')"
            :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
      <pv-button type="submit" icon="pi pi-save" :label="saving ? t('common.saving') : t('common.save-changes')" :loading="saving" />
    </form>
  </section>
</template>
