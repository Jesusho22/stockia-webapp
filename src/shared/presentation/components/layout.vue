<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useIamStore } from '../../../iam/application/iam.store.js';
import LanguageSwitcher from './language-switcher.vue';
import FooterContent from './footer-content.vue';

/**
 * Main presentation layout of the authenticated area: side navigation, top
 * bar with language switcher and user menu, and the routed view.
 */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();

const drawerVisible = ref(false);

const navItems = [
  { key: 'dashboard', to: '/app/dashboard', icon: 'pi pi-chart-bar' },
  { key: 'inventory', to: '/app/inventory', icon: 'pi pi-box' },
  { key: 'recipes', to: '/app/recipes', icon: 'pi pi-book' },
  { key: 'sales', to: '/app/sales', icon: 'pi pi-receipt' },
  { key: 'forecast', to: '/app/forecast', icon: 'pi pi-chart-line' },
  { key: 'alerts', to: '/app/alerts', icon: 'pi pi-bell' },
  { key: 'recommendations', to: '/app/recommendations', icon: 'pi pi-lightbulb' },
  { key: 'roles', to: '/app/roles', icon: 'pi pi-users', adminOnly: true },
  { key: 'plans', to: '/app/plans', icon: 'pi pi-credit-card' },
];

const visibleItems = computed(() => navItems.filter((item) => !item.adminOnly || iamStore.isAdmin));
const user = computed(() => iamStore.currentUser);
const initial = computed(() => (user.value?.fullName || '?').charAt(0).toUpperCase());

// Close the mobile drawer after navigating.
watch(() => route.fullPath, () => { drawerVisible.value = false; });

function signOut() {
  iamStore.signOut();
  router.push({ name: 'sign-in' });
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar" :aria-label="t('layout.sidebar')">
      <div class="brand"><span class="brand-mark" aria-hidden="true">S</span><span>StockIA</span></div>
      <nav :aria-label="t('layout.main-navigation')">
        <ul class="nav-list">
          <li v-for="item in visibleItems" :key="item.key">
            <router-link :to="item.to" class="nav-link" active-class="active">
              <i :class="item.icon" aria-hidden="true" />
              <span>{{ t(`nav.${item.key}`) }}</span>
            </router-link>
          </li>
        </ul>
      </nav>
      <p class="env-tag">{{ t('layout.environment-tag') }}</p>
    </aside>

    <pv-drawer v-model:visible="drawerVisible" :header="'StockIA'" class="mobile-drawer">
      <nav :aria-label="t('layout.main-navigation')">
        <ul class="nav-list">
          <li v-for="item in visibleItems" :key="item.key">
            <router-link :to="item.to" class="nav-link nav-link-light" active-class="active">
              <i :class="item.icon" aria-hidden="true" />
              <span>{{ t(`nav.${item.key}`) }}</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </pv-drawer>

    <div class="main-area">
      <header class="topbar">
        <pv-button
          class="menu-toggle"
          icon="pi pi-bars"
          text
          :aria-label="t('layout.open-menu')"
          :aria-expanded="drawerVisible"
          @click="drawerVisible = true"
        />
        <div class="topbar-end">
          <language-switcher />
          <router-link to="/app/profile" class="user-chip" :aria-label="t('layout.edit-profile', { name: user?.fullName })">
            <pv-avatar :label="initial" shape="circle" class="user-avatar" aria-hidden="true" />
            <span class="user-text">
              <strong>{{ user?.fullName }}</strong>
              <span>{{ user ? t(`iam.roles.${user.role}`) : '' }}</span>
            </span>
          </router-link>
          <pv-button :label="t('layout.sign-out')" icon="pi pi-sign-out" severity="secondary" text @click="signOut" />
        </div>
      </header>
      <main id="main-content" class="content" tabindex="-1">
        <router-view />
      </main>
      <footer-content />
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  min-height: 100vh;
}
.sidebar {
  background: var(--color-primary-dark);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem;
  position: sticky;
  top: 0;
  height: 100vh;
}
.brand { display: flex; align-items: center; gap: .5rem; font-weight: 800; font-size: 1.1rem; padding: .5rem .5rem 1.5rem; }
.brand-mark {
  width: 30px; height: 30px; border-radius: 8px; background: var(--color-accent-strong);
  display: flex; align-items: center; justify-content: center; font-weight: 800;
}
nav { flex: 1; }
.nav-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .2rem; }
.nav-link {
  display: flex;
  align-items: center;
  gap: .7rem;
  padding: .65rem .75rem;
  border-radius: var(--radius-sm);
  color: rgba(255, 255, 255, .85);
  text-decoration: none;
  font-size: .9rem;
  font-weight: 500;
}
.nav-link:hover { background: rgba(255, 255, 255, .08); color: #fff; }
.nav-link.active { background: var(--color-accent-strong); color: #fff; font-weight: 700; }
.nav-link-light { color: var(--color-text); }
.nav-link-light:hover { background: var(--color-bg); color: var(--color-primary-dark); }
.env-tag { color: rgba(255, 255, 255, .7); font-size: .72rem; margin: 0; padding: .5rem; }

.main-area { display: flex; flex-direction: column; min-width: 0; }
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: .75rem 1.75rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.topbar-end { display: flex; align-items: center; gap: .75rem; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
.menu-toggle { display: none; }
.user-chip { display: flex; align-items: center; gap: .6rem; text-decoration: none; color: inherit; border-radius: var(--radius-sm); padding: .25rem .4rem; }
.user-chip:hover { background: var(--color-bg); }
.user-avatar { background: var(--color-primary-light); color: #fff; font-weight: 700; }
.user-text strong { display: block; font-size: .85rem; }
.user-text span { display: block; font-size: .72rem; color: var(--color-muted); }
.content { padding: 1.75rem; flex: 1; outline: none; }

@media (max-width: 860px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .menu-toggle { display: inline-flex; }
  .user-text { display: none; }
  .content { padding: 1.25rem 1rem; }
  .topbar { padding: .75rem 1rem; }
}
</style>
