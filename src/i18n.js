import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import es from './locales/es.json';

/** Key used to remember the language chosen by the user in this browser. */
export const LOCALE_STORAGE_KEY = 'stockia.locale';

/** Locales supported by the Web Application. English is the default one. */
export const SUPPORTED_LOCALES = ['en', 'es'];

/**
 * Reads the language previously chosen by the user, falling back to English.
 *
 * @returns {string}
 */
function initialLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(saved) ? saved : 'en';
  } catch {
    return 'en';
  }
}

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
 * Base language: English (en). Alternative language: Latin American Spanish (es).
 */
const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages: { en, es },
  numberFormats,
  datetimeFormats,
});

export default i18n;
