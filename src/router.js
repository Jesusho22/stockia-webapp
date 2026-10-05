import { createRouter, createWebHistory } from 'vue-router';
import { useIamStore } from './iam/application/iam.store.js';

/**
 * Application routes. Each view is loaded lazily, so every Bounded Context
 * ships in its own chunk. Paths match the ones referenced by the Landing Page
 * call-to-action buttons (`/auth/sign-up`, `/auth/sign-in`).
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
      { path: 'recommendations', name: 'recommendations', component: () => import('./alerts/presentation/views/recommendations-list.vue') },
      { path: 'roles', name: 'roles', component: () => import('./iam/presentation/views/team-roles.vue'), meta: { requiresAdmin: true } },
      { path: 'profile', name: 'profile', component: () => import('./iam/presentation/views/profile.vue') },
      { path: 'plans', name: 'plans', component: () => import('./subscription/presentation/views/plans-page.vue') },
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
 * Navigation guard: protected views require a session, the team view requires
 * the Administrator role, and a signed-in user skips the sign-in/sign-up forms.
 */
router.beforeEach((to) => {
  const iamStore = useIamStore();
  if (to.matched.some((record) => record.meta.requiresAuth) && !iamStore.isAuthenticated) {
    return { name: 'sign-in', query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresAdmin && !iamStore.isAdmin) return { name: 'dashboard' };
  if (to.meta.guestOnly && iamStore.isAuthenticated) return { name: 'dashboard' };
  return true;
});

export default router;
