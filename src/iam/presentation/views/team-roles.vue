<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useIamStore, INVITATION_TEMPORARY_PASSWORD } from '../../application/iam.store.js';
import { UserRole } from '../../domain/model/user-role.js';
import { toErrorMessage } from '../../../shared/domain/model/business-rule-error.js';
import { email, minLength, required, validate } from '../../../shared/presentation/validation.js';
import PageHeader from '../../../shared/presentation/components/page-header.vue';
import FormField from '../../../shared/presentation/components/form-field.vue';

/**
 * Team view (Administrator only): assign roles, invite and remove members.
 */
const { t } = useI18n();
const toast = useToast();
const confirm = useConfirm();
const iamStore = useIamStore();

const loading = ref(true);
const dialogVisible = ref(false);
const submitted = ref(false);
const invite = reactive({ fullName: '', email: '', role: UserRole.EMPLOYEE });

const roleOptions = computed(() => Object.values(UserRole).map((role) => ({ value: role, label: t(`iam.roles.${role}`) })));
const errors = computed(() => (submitted.value ? validate(invite, { fullName: [required, minLength(3)], email: [email], role: [required] }) : {}));

function showError(error, fallback) {
  const { code, params } = toErrorMessage(error, fallback);
  toast.add({ severity: 'error', summary: t(code, params), life: 4000 });
}

onMounted(async () => {
  try {
    await iamStore.loadUsers();
  } catch (error) {
    showError(error, 'errors.load');
  } finally {
    loading.value = false;
  }
});

function openInvite() {
  Object.assign(invite, { fullName: '', email: '', role: UserRole.EMPLOYEE });
  submitted.value = false;
  dialogVisible.value = true;
}

async function sendInvite() {
  submitted.value = true;
  if (Object.keys(errors.value).length > 0) return;
  try {
    await iamStore.inviteMember(invite);
    dialogVisible.value = false;
    toast.add({ severity: 'success', summary: t('team.invited', { name: invite.fullName }), life: 3000 });
  } catch (error) {
    showError(error, 'team.invite-error');
  }
}

async function changeRole(user, role) {
  try {
    await iamStore.changeRole(user, role);
    toast.add({ severity: 'success', summary: t('team.role-changed', { name: user.fullName, role: t(`iam.roles.${role}`) }), life: 2500 });
  } catch (error) {
    showError(error, 'errors.save');
  }
}

function remove(user) {
  confirm.require({
    header: t('team.remove-title'),
    message: t('team.remove-confirm', { name: user.fullName }),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('common.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('common.delete'), severity: 'danger' },
    accept: async () => {
      try {
        await iamStore.removeMember(user);
        toast.add({ severity: 'success', summary: t('team.removed', { name: user.fullName }), life: 2500 });
      } catch (error) {
        showError(error, 'errors.delete');
      }
    },
  });
}
</script>

<template>
  <page-header :title="t('team.title')" :description="t('team.description')">
    <template #actions>
      <pv-button icon="pi pi-user-plus" :label="t('team.invite')" @click="openInvite" />
    </template>
  </page-header>

  <section class="surface-card" :aria-label="t('team.table-label')">
    <pv-data-table :value="iamStore.users" :loading="loading" data-key="id"
      :aria-label="t('team.table-label')">
      <template #empty><div class="empty-state">{{ t('team.empty') }}</div></template>
      <pv-column field="fullName" :header="t('fields.full-name')">
        <template #body="{ data }">
          {{ data.fullName }}
          <pv-tag v-if="data.id === iamStore.currentUser?.id" :value="t('team.you')" severity="secondary" class="ml-2" />
        </template>
      </pv-column>
      <pv-column field="email" :header="t('fields.email')" />
      <pv-column field="restaurantName" :header="t('fields.restaurant-name')" />
      <pv-column :header="t('fields.role')">
        <template #body="{ data }">
          <pv-select :model-value="data.role" :options="roleOptions" option-label="label" option-value="value"
            :disabled="!iamStore.canChangeRole(data)" :aria-label="t('team.role-of', { name: data.fullName })"
            @update:model-value="(role) => changeRole(data, role)" />
        </template>
      </pv-column>
      <pv-column :header="t('common.actions')">
        <template #body="{ data }">
          <div class="row-actions">
            <pv-button icon="pi pi-trash" severity="danger" text rounded :aria-label="t('team.remove-of', { name: data.fullName })"
              v-tooltip.top="t('common.delete')" @click="remove(data)" />
          </div>
        </template>
      </pv-column>
    </pv-data-table>
  </section>

  <pv-dialog v-model:visible="dialogVisible" modal :header="t('team.invite-title')" :style="{ width: '28rem' }" :breakpoints="{ '575px': '92vw' }">
    <form id="invite-form" novalidate @submit.prevent="sendInvite">
      <form-field id="invite-full-name" :label="t('fields.full-name')" :error="errors.fullName">
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="invite.fullName" autocomplete="off" :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
      <form-field id="invite-email" :label="t('fields.email')" :error="errors.email">
        <template #default="{ id, describedBy, invalid }">
          <pv-input-text :id="id" v-model="invite.email" type="email" autocomplete="off" :placeholder="t('placeholders.team-email')"
            :invalid="invalid" :aria-invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
      <form-field id="invite-role" :label="t('fields.role')" :error="errors.role"
        :hint="t('team.temporary-password', { password: INVITATION_TEMPORARY_PASSWORD })">
        <template #default="{ id, describedBy, invalid }">
          <pv-select v-model="invite.role" :input-id="id" :options="roleOptions" option-label="label" option-value="value"
            :invalid="invalid" :aria-describedby="describedBy" />
        </template>
      </form-field>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" outlined @click="dialogVisible = false" />
      <pv-button type="submit" form="invite-form" icon="pi pi-send" :label="t('team.send-invite')" />
    </template>
  </pv-dialog>
</template>
