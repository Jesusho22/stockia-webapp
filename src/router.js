import { createRouter, createWebHistory } from 'vue-router';
import { useIamStore } from './iam/application/iam.store.js';
import { notify } from './shared/application/notifications.js';

/**
 * Application routes. Each view is loaded lazily from the folder of its
 * Bounded Context (iam, restaurant-registration, stock-management,
 * recipes-management, ml-recommendations, notifications-messaging,
 * analytics-dashboard, subscription-payments), so every context ships in its
 * own chunk. Paths match the ones referenced by the Landing Page
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
    component: () => import('./restaurant-registration/presentation/views/sign-up.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/auth/forgot-password',
    name: 'forgot-password',
    component: () => import('./iam/presentation/views/forgot-password.vue'),
    meta: { guestOnly: true },
  },
  {
    // Recovery link of the password email: ?email=…&code=…
    path: '/auth/reset-password',
    name: 'reset-password',
    component: () => import('./iam/presentation/views/reset-password.vue'),
  },
  {
    path: '/app',
    component: () => import('./shared/presentation/components/layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'dashboard' } },
      { path: 'dashboard', name: 'dashboard', component: () => import('./analytics-dashboard/presentation/views/business-dashboard.vue') },
      { path: 'inventory', name: 'inventory', component: () => import('./stock-management/presentation/views/inventory-list.vue') },
      { path: 'recipes', name: 'recipes', component: () => import('./recipes-management/presentation/views/recipe-list.vue') },
      { path: 'sales', name: 'sales', component: () => import('./recipes-management/presentation/views/sales-history.vue') },
      { path: 'forecast', name: 'forecast', component: () => import('./ml-recommendations/presentation/views/forecast-dashboard.vue') },
      { path: 'alerts', name: 'alerts', component: () => import('./notifications-messaging/presentation/views/alerts-list.vue') },
      {
        path: 'recommendations',
        name: 'recommendations',
        component: () => import('./ml-recommendations/presentation/views/recommendations-list.vue'),
        meta: { adminOnly: true },
      },
      { path: 'roles', name: 'roles', component: () => import('./iam/presentation/views/team-roles.vue'), meta: { adminOnly: true } },
      // Settings: account settings, help, upgrade plan and sign out (in the menu).
      { path: 'settings', name: 'settings', component: () => import('./shared/presentation/views/settings-hub.vue') },
      { path: 'settings/account', name: 'settings-account', component: () => import('./iam/presentation/views/account-settings.vue') },
      { path: 'settings/help', name: 'settings-help', component: () => import('./shared/presentation/views/help-center.vue') },
      {
        path: 'settings/plans',
        name: 'settings-plans',
        component: () => import('./subscription-payments/presentation/views/plans-page.vue'),
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
