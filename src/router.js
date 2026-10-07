import { createRouter, createWebHistory } from 'vue-router';
import { useIamStore } from './iam/application/iam.store.js';
import { notify } from './shared/application/notifications.js';

/**
 * Application routes. Each view is loaded lazily, so every Bounded Context
 * ships in its own chunk. Paths match the ones referenced by the Landing Page
 * call-to-action buttons (`/auth/sign-up`, `/auth/sign-in`).
 *
 * @remarks
 * `meta.adminOnly` marks the views an Employee cannot open (Roles &
 * permissions, Recommendations and Upgrade plan). The side menu reads the same
 * flag, so menu and guard never disagree.
 */
const routes = [
  { path: '/', redirect: { name: 'sign-in' } },
  {
    path: '/auth/sign-in',
    name: 'sign-in',
    component: () => import('./iam/presentation/views/sign-in.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/auth/sign-up',
    name: 'sign-up',
    component: () => import('./iam/presentation/views/sign-up.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/app',
    component: () => import('./shared/presentation/components/layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'dashboard' } },
      { path: 'dashboard', name: 'dashboard', component: () => import('./dashboard/presentation/views/business-dashboard.vue') },
      { path: 'inventory', name: 'inventory', component: () => import('./product-inventory/presentation/views/inventory-list.vue') },
      { path: 'recipes', name: 'recipes', component: () => import('./product-inventory/presentation/views/recipe-list.vue') },
      { path: 'sales', name: 'sales', component: () => import('./sales-order/presentation/views/sales-history.vue') },
      { path: 'forecast', name: 'forecast', component: () => import('./demand-forecasting/presentation/views/forecast-dashboard.vue') },
      { path: 'alerts', name: 'alerts', component: () => import('./alerts/presentation/views/alerts-list.vue') },
      {
        path: 'recommendations',
        name: 'recommendations',
        component: () => import('./alerts/presentation/views/recommendations-list.vue'),
        meta: { adminOnly: true },
      },
      { path: 'roles', name: 'roles', component: () => import('./iam/presentation/views/team-roles.vue'), meta: { adminOnly: true } },
      // Settings: account settings, help, upgrade plan and sign out (in the menu).
      { path: 'settings', name: 'settings', component: () => import('./settings/presentation/views/settings-hub.vue') },
      { path: 'settings/account', name: 'settings-account', component: () => import('./settings/presentation/views/account-settings.vue') },
      { path: 'settings/help', name: 'settings-help', component: () => import('./settings/presentation/views/help-center.vue') },
      {
        path: 'settings/plans',
        name: 'settings-plans',
        component: () => import('./subscription/presentation/views/plans-page.vue'),
        meta: { adminOnly: true },
      },
      // Old paths (before the Settings menu) keep working.
      { path: 'profile', redirect: { name: 'settings-account' } },
      { path: 'plans', redirect: { name: 'settings-plans' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'sign-in' } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

/**
 * Navigation guard: protected views require a session, `adminOnly` views
 * require the Administrator role, and a signed-in user skips the
 * sign-in/sign-up forms. Every blocked navigation shows a notification.
 */
router.beforeEach((to, from) => {
  const iamStore = useIamStore();
  if (to.matched.some((record) => record.meta.requiresAuth) && !iamStore.isAuthenticated) {
    // Opening a protected link without a session (not the sign-out itself).
    if (from.matched.length === 0 || !from.path.startsWith('/app')) {
      notify({ severity: 'warn', summary: 'access.session-required', detail: 'access.session-required-detail' });
    }
    return { name: 'sign-in', query: { redirect: to.fullPath } };
  }
  if (to.matched.some((record) => record.meta.adminOnly) && !iamStore.isAdmin) {
    notify({ severity: 'error', summary: 'access.denied', detail: 'access.denied-detail' });
    // Stay on the current view when there is one; otherwise go to the dashboard.
    return from.matched.length > 0 && from.path.startsWith('/app') ? false : { name: 'dashboard' };
  }
  if (to.meta.guestOnly && iamStore.isAuthenticated) return { name: 'dashboard' };
  return true;
});

export default router;
