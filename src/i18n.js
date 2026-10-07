import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import es from './locales/es.json';

/** Locales supported by the Web Application. English is the default one. */
export const SUPPORTED_LOCALES = ['en', 'es'];

/** Language the app always starts in. */
export const DEFAULT_LOCALE = 'en';

const numberFormats = {
  en: {
    decimal: { style: 'decimal', maximumFractionDigits: 2 },
    percent: { style: 'percent', maximumFractionDigits: 0 },
  },
  es: {
    decimal: { style: 'decimal', maximumFractionDigits: 2 },
    percent: { style: 'percent', maximumFractionDigits: 0 },
  },
};

const datetimeFormats = {
  en: {
    date: { year: 'numeric', month: '2-digit', day: '2-digit' },
    weekday: { weekday: 'short' },
    short: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    long: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  },
  es: {
    date: { year: 'numeric', month: '2-digit', day: '2-digit' },
    weekday: { weekday: 'short' },
    short: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    long: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  },
};

/**
 * Shared internationalization service used across presentation modules.
 *
 * @remarks
 * The app always opens in English (en). The user can switch to Latin American
 * Spanish (es) from the header; the choice lasts until the page is reloaded.
 */
const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, es },
  numberFormats,
  datetimeFormats,
});

export default i18n;
