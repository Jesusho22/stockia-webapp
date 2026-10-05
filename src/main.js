import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import ConfirmDialog from 'primevue/confirmdialog';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Drawer from 'primevue/drawer';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import Tooltip from 'primevue/tooltip';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './style.css';

import App from './app.vue';
import i18n from './i18n.js';
import router from './router.js';
import { StockiaPreset } from './shared/presentation/theme/stockia-preset.js';

/**
 * Application composition root.
 *
 * @remarks
 * Wires cross-cutting services (state, routing, i18n and the PrimeVue UI kit)
 * before mounting the presentation shell. Pinia is installed before the router
 * so the navigation guards can read the IAM session store.
 */
createApp(App)
  .use(createPinia())
  .use(i18n)
  .use(router)
  .use(PrimeVue, { ripple: true, theme: { preset: StockiaPreset, options: { darkModeSelector: '.stockia-dark' } } })
  .use(ToastService)
  .use(ConfirmationService)
  .component('pv-avatar', Avatar)
  .component('pv-button', Button)
  .component('pv-card', Card)
  .component('pv-column', Column)
  .component('pv-confirm-dialog', ConfirmDialog)
  .component('pv-data-table', DataTable)
  .component('pv-dialog', Dialog)
  .component('pv-drawer', Drawer)
  .component('pv-input-number', InputNumber)
  .component('pv-input-text', InputText)
  .component('pv-message', Message)
  .component('pv-password', Password)
  .component('pv-progress-spinner', ProgressSpinner)
  .component('pv-select', Select)
  .component('pv-select-button', SelectButton)
  .component('pv-tag', Tag)
  .component('pv-toast', Toast)
  .directive('tooltip', Tooltip)
  .mount('#app');
