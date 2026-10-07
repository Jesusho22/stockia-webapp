<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useIamStore } from '../../../iam/application/iam.store.js';
import LanguageSwitcher from './language-switcher.vue';
import FooterContent from './footer-content.vue';

/**
 * Main presentation layout of the authenticated area.
 *
 * @remarks
 * - Header: brand (mobile), language switcher (EN/ES) and the user chip, which
 *   opens Account settings. Signing out lives in the Settings menu, not here.
 * - Side navigation (desktop) and a dropdown menu under the header (phones and
 *   tablets up to 860px) with the same items.
 * - Items are filtered by role with the `adminOnly` meta of each route, so the
 *   menu and the router guard follow the same rule: an Employee does not see
 *   Roles & permissions, Recommendations or Upgrade plan.
 */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();

const mainItems = [
  { key: 'dashboard', to: '/app/dashboard', icon: 'pi pi-chart-bar' },
  { key: 'inventory', to: '/app/inventory', icon: 'pi pi-box' },
  { key: 'recipes', to: '/app/recipes', icon: 'pi pi-book' },
  { key: 'sales', to: '/app/sales', icon: 'pi pi-receipt' },
  { key: 'forecast', to: '/app/forecast', icon: 'pi pi-chart-line' },
  { key: 'alerts', to: '/app/alerts', icon: 'pi pi-bell' },
  { key: 'recommendations', to: '/app/recommendations', icon: 'pi pi-lightbulb' },
  { key: 'roles', to: '/app/roles', icon: 'pi pi-users' },
];
const settingsItems = [
  { key: 'settings-account', to: '/app/settings/account', icon: 'pi pi-user-edit' },
  { key: 'settings-help', to: '/app/settings/help', icon: 'pi pi-question-circle' },
  { key: 'settings-plans', to: '/app/settings/plans', icon: 'pi pi-star' },
];

/** @param {{to: string}} item */
function isAllowed(item) {
  return !router.resolve(item.to).meta.adminOnly || iamStore.isAdmin;
}

const visibleMainItems = computed(() => mainItems.filter(isAllowed));
const visibleSettingsItems = computed(() => settingsItems.filter(isAllowed));
const user = computed(() => iamStore.currentUser);
const initial = computed(() => (user.value?.fullName || '?').charAt(0).toUpperCase());
const inSettings = computed(() => route.path.startsWith('/app/settings'));

const settingsOpen = ref(inSettings.value);
const mobileMenuOpen = ref(false);
const menuToggle = ref(null);
const mobileMenu = ref(null);

function closeMobileMenu({ restoreFocus = false } = {}) {
  if (!mobileMenuOpen.value) return;
  mobileMenuOpen.value = false;
  if (restoreFocus) nextTick(() => menuToggle.value?.focus());
}

async function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  if (mobileMenuOpen.value) {
    await nextTick();
    mobileMenu.value?.querySelector('a, button')?.focus();
  }
}

/** @param {KeyboardEvent} event */
function onKeydown(event) {
  if (event.key === 'Escape') closeMobileMenu({ restoreFocus: true });
}

// Close the mobile menu after navigating, and open the Settings group inside it.
watch(() => route.fullPath, () => {
  closeMobileMenu();
  if (inSettings.value) settingsOpen.value = true;
});

onMounted(() => document.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));

function signOut() {
  closeMobileMenu();
  iamStore.signOut();
  router.push({ name: 'sign-in' });
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar" :aria-label="t('layout.sidebar')">
      <div class="brand"><span class="brand-mark" aria-hidden="true">S</span><span>StockIA</span></div>
      <nav class="sidebar-nav" :aria-label="t('layout.main-navigation')">
        <ul class="nav-list">
          <li v-for="item in visibleMainItems" :key="item.key">
            <router-link :to="item.to" class="nav-link" active-class="active">
              <i :class="item.icon" aria-hidden="true" />
              <span>{{ t(`nav.${item.key}`) }}</span>
            </router-link>
          </li>
        </ul>

        <div class="nav-group">
          <button
            type="button"
            class="nav-link nav-group-toggle"
            :class="{ 'is-current': inSettings }"
            :aria-expanded="settingsOpen"
            aria-controls="sidebar-settings"
            @click="settingsOpen = !settingsOpen"
          >
            <i class="pi pi-cog" aria-hidden="true" />
            <span>{{ t('nav.settings') }}</span>
            <i class="pi chevron" :class="settingsOpen ? 'pi-chevron-up' : 'pi-chevron-down'" aria-hidden="true" />
          </button>
          <ul v-show="settingsOpen" id="sidebar-settings" class="nav-list nav-sublist">
            <li v-for="item in visibleSettingsItems" :key="item.key">
              <router-link :to="item.to" class="nav-link" active-class="active">
                <i :class="item.icon" aria-hidden="true" />
                <span>{{ t(`nav.${item.key}`) }}</span>
              </router-link>
            </li>
            <li>
              <button type="button" class="nav-link nav-sign-out" @click="signOut">
                <i class="pi pi-sign-out" aria-hidden="true" />
                <span>{{ t('nav.sign-out') }}</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
      <p class="env-tag">{{ t('layout.environment-tag') }}</p>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <button
          ref="menuToggle"
          type="button"
          class="menu-toggle"
          :aria-label="mobileMenuOpen ? t('layout.close-menu') : t('layout.open-menu')"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-menu"
          @click="toggleMobileMenu"
        >
          <i :class="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" aria-hidden="true" />
        </button>
        <router-link to="/app/dashboard" class="topbar-brand" :aria-label="t('layout.go-home')">
          <span class="brand-mark" aria-hidden="true">S</span><span>StockIA</span>
        </router-link>

        <div class="topbar-end">
          <language-switcher />
          <router-link to="/app/settings/account" class="user-chip" :aria-label="t('layout.open-settings', { name: user?.fullName })">
            <pv-avatar :label="initial" shape="circle" class="user-avatar" aria-hidden="true" />
            <span class="user-text">
              <strong>{{ user?.fullName }}</strong>
              <span>{{ user ? t(`iam.roles.${user.role}`) : '' }}</span>
            </span>
          </router-link>
        </div>

        <!-- Dropdown menu for phones and tablets. -->
        <transition name="menu-slide">
          <nav v-show="mobileMenuOpen" id="mobile-menu" ref="mobileMenu" class="mobile-menu" :aria-label="t('layout.main-navigation')">
            <ul class="nav-list">
              <li v-for="item in visibleMainItems" :key="item.key">
                <router-link :to="item.to" class="nav-link nav-link-light" active-class="active">
                  <i :class="item.icon" aria-hidden="true" />
                  <span>{{ t(`nav.${item.key}`) }}</span>
                </router-link>
              </li>
            </ul>
            <p class="mobile-group-title" id="mobile-settings-title">
              <i class="pi pi-cog" aria-hidden="true" /> {{ t('nav.settings') }}
            </p>
            <ul class="nav-list" aria-labelledby="mobile-settings-title">
              <li v-for="item in visibleSettingsItems" :key="item.key">
                <router-link :to="item.to" class="nav-link nav-link-light" active-class="active">
                  <i :class="item.icon" aria-hidden="true" />
                  <span>{{ t(`nav.${item.key}`) }}</span>
                </router-link>
              </li>
              <li>
                <button type="button" class="nav-link nav-link-light nav-sign-out" @click="signOut">
                  <i class="pi pi-sign-out" aria-hidden="true" />
                  <span>{{ t('nav.sign-out') }}</span>
                </button>
              </li>
            </ul>
          </nav>
        </transition>
      </header>
      <div v-if="mobileMenuOpen" class="mobile-backdrop" aria-hidden="true" @click="closeMobileMenu()" />

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
  overflow-y: auto;
}
.brand { display: flex; align-items: center; gap: .5rem; font-weight: 800; font-size: 1.1rem; padding: .5rem .5rem 1.5rem; }
.brand-mark {
  width: 30px; height: 30px; border-radius: 8px; background: var(--color-accent-strong); color: #fff;
  display: inline-flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0;
}
.sidebar-nav { flex: 1; }
.nav-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .2rem; }
.nav-link {
  display: flex;
  align-items: center;
  gap: .7rem;
  width: 100%;
  padding: .65rem .75rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: rgba(255, 255, 255, .85);
  text-decoration: none;
  font: inherit;
  font-size: .9rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}
.nav-link:hover { background: rgba(255, 255, 255, .08); color: #fff; }
.nav-link.active { background: var(--color-accent-strong); color: #fff; font-weight: 700; }
.nav-group { margin-top: .9rem; padding-top: .9rem; border-top: 1px solid rgba(255, 255, 255, .14); }
.nav-group-toggle.is-current { color: #fff; font-weight: 700; }
.nav-group-toggle .chevron { margin-left: auto; font-size: .75rem; }
.nav-sublist { margin-top: .2rem; padding-left: .75rem; }
.nav-sign-out { color: #ffd2bf; }
.env-tag { color: rgba(255, 255, 255, .7); font-size: .72rem; margin: 0; padding: .5rem; }

.main-area { display: flex; flex-direction: column; min-width: 0; }
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .75rem 1.75rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.topbar-end { display: flex; align-items: center; gap: .75rem; margin-left: auto; }
.menu-toggle, .topbar-brand { display: none; }
.user-chip { display: flex; align-items: center; gap: .6rem; text-decoration: none; color: inherit; border-radius: var(--radius-sm); padding: .25rem .4rem; }
.user-chip:hover { background: var(--color-bg); }
.user-avatar { background: var(--color-primary-light); color: #fff; font-weight: 700; }
.user-text strong { display: block; font-size: .85rem; }
.user-text span { display: block; font-size: .72rem; color: var(--color-muted); }
.content { padding: 1.75rem; flex: 1; outline: none; }
.mobile-menu { display: none; }
.mobile-backdrop { display: none; }

@media (max-width: 860px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .topbar { padding: .6rem 1rem; gap: .5rem; }
  .menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-primary-dark);
    font-size: 1.15rem;
    cursor: pointer;
    flex-shrink: 0;
  }
  .menu-toggle[aria-expanded='true'] { background: var(--color-primary-dark); color: #fff; border-color: var(--color-primary-dark); }
  .topbar-brand { display: inline-flex; align-items: center; gap: .45rem; font-weight: 800; color: var(--color-primary-dark); text-decoration: none; }
  .topbar-end { gap: .4rem; }
  .user-text { display: none; }
  .content { padding: 1.25rem 1rem; }

  .mobile-menu {
    display: block;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    padding: .75rem 1rem 1rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    box-shadow: var(--shadow-md);
  }
  .nav-link-light { color: var(--color-text); padding: .8rem .75rem; }
  .nav-link-light:hover { background: var(--color-bg); color: var(--color-primary-dark); }
  .nav-link-light.active { color: #fff; }
  .nav-link-light.nav-sign-out { color: var(--color-danger); }
  .mobile-group-title {
    display: flex; align-items: center; gap: .5rem;
    margin: .9rem 0 .35rem; padding: .75rem .75rem 0;
    border-top: 1px solid var(--color-border);
    font-size: .75rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--color-muted);
  }
  .mobile-backdrop { display: block; position: fixed; inset: 0; z-index: 20; background: rgba(20, 48, 31, .35); }
}

@media (max-width: 400px) {
  .topbar-brand span:last-child { display: none; }
}

.menu-slide-enter-active, .menu-slide-leave-active { transition: opacity .15s ease, transform .15s ease; }
.menu-slide-enter-from, .menu-slide-leave-to { opacity: 0; transform: translateY(-6px); }
@media (prefers-reduced-motion: reduce) {
  .menu-slide-enter-active, .menu-slide-leave-active { transition: none; }
}
</style>
