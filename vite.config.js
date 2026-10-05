import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // The PrimeVue chunk (components + Aura theme tokens) is ~160 kB gzipped.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Vendor libraries in their own chunks: they change less often than
        // the app code, so browsers keep them cached between deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/](primevue|@primevue|@primeuix)[\\/]/.test(id)) return 'primevue';
          if (/[\\/](vue|@vue|vue-router|pinia|vue-i18n|@intlify)[\\/]/.test(id)) return 'vue-vendor';
          return 'vendor';
        },
      },
    },
  },
});
