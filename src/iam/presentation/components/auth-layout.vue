<script setup>
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';

/**
 * Two-column layout shared by the sign-in and sign-up views: value
 * proposition on the left, form on the right.
 */
defineProps({
  headline: { type: String, required: true },
  description: { type: String, required: true },
  highlights: { type: Array, default: () => [] },
});

const { t } = useI18n();
</script>

<template>
  <div class="auth-shell">
    <aside class="auth-aside" :aria-label="t('auth.about-stockia')">
      <div class="logo"><span class="logo-mark" aria-hidden="true">S</span><span>StockIA</span></div>
      <p class="headline">{{ headline }}</p>
      <p>{{ description }}</p>
      <ul>
        <li v-for="item in highlights" :key="item"><i class="pi pi-check" aria-hidden="true" />{{ item }}</li>
      </ul>
    </aside>
    <main id="main-content" class="auth-main" tabindex="-1">
      <div class="auth-language"><language-switcher /></div>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
}
.auth-aside {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem;
  color: #fff;
  background: linear-gradient(160deg, var(--color-primary-dark), var(--color-primary));
}
.logo { display: flex; align-items: center; gap: .6rem; font-weight: 800; font-size: 1.3rem; margin-bottom: 2.5rem; }
.logo-mark {
  width: 36px; height: 36px; border-radius: 10px; background: var(--color-accent-strong);
  display: flex; align-items: center; justify-content: center; font-weight: 800;
}
.headline { color: #fff; font-size: 2rem; font-weight: 800; line-height: 1.2; max-width: 420px; }
.auth-aside p { color: rgba(255, 255, 255, .85); max-width: 420px; }
.auth-aside ul { list-style: none; padding: 0; margin-top: 2rem; display: flex; flex-direction: column; gap: .9rem; }
.auth-aside li { display: flex; gap: .6rem; align-items: center; color: rgba(255, 255, 255, .92); font-size: .92rem; }
.auth-aside li .pi { color: var(--color-accent); font-weight: 800; }
.auth-main {
  position: relative;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4.5rem 1.5rem 2rem;
  outline: none;
}
.auth-language { position: absolute; top: 1.25rem; right: 1.5rem; }

@media (max-width: 860px) {
  .auth-shell { grid-template-columns: 1fr; }
  .auth-aside { display: none; }
}
</style>
