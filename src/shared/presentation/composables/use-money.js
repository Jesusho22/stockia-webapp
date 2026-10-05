import { useI18n } from 'vue-i18n';

/** Intl locale used to format numbers for each language of the app. */
const NUMBER_LOCALE = { en: 'en-US', es: 'es-PE' };

/**
 * Formats amounts in Peruvian soles (S/) for the active language.
 *
 * @remarks
 * `Intl` writes "PEN 28.00" for English, so the sol symbol is added
 * explicitly to keep "S/ 28.00" in both languages.
 *
 * @returns {{formatMoney: (amount: number) => string}}
 */
export function useMoney() {
  const { locale } = useI18n();

  function formatMoney(amount) {
    const formatter = new Intl.NumberFormat(NUMBER_LOCALE[locale.value] ?? 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `S/ ${formatter.format(Number(amount) || 0)}`;
  }

  return { formatMoney };
}
