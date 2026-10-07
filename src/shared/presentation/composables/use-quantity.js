import { useI18n } from 'vue-i18n';
import { DecimalQuantity } from '../../domain/model/decimal-quantity.js';

/**
 * Formats stock quantities for the active language keeping every decimal
 * (up to 32), e.g. "1,250.125".
 *
 * @returns {{formatQuantity: (value: number|string, unit?: string) => string}}
 */
export function useQuantity() {
  const { locale } = useI18n();

  function formatQuantity(value, unit = '') {
    const text = DecimalQuantity.format(value, locale.value);
    return unit ? `${text} ${unit}` : text;
  }

  return { formatQuantity };
}
