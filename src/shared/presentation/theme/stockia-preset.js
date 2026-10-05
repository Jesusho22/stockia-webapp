import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * PrimeVue theme preset with the StockIA brand.
 *
 * @remarks
 * The primary palette is the StockIA accent (terracotta). The semantic primary
 * color uses the 600 shade so white text on buttons keeps a contrast ratio of
 * at least 4.5:1 (WCAG 2.1 AA).
 */
export const StockiaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fdf3ee',
      100: '#fae0d3',
      200: '#f5c1a7',
      300: '#ef9d76',
      400: '#e9804f',
      500: '#e2672d',
      600: '#b84a1a',
      700: '#a1431a',
      800: '#7c3416',
      900: '#5c2711',
      950: '#3a180a',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.800}',
          focusColor: '{primary.900}',
        },
      },
    },
  },
});
