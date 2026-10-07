/**
 * Small validation helpers shared by the forms of the presentation layer.
 * Each rule returns `null` when the value is valid, or an i18n message
 * (`{ code, params }`) that the view renders with `t(code, params)`.
 *
 * @typedef {{code: string, params?: Record<string, unknown>}} ValidationMessage
 * @typedef {(value: any) => ValidationMessage|null} ValidationRule
 */

import { DecimalQuantity, MAX_QUANTITY_DECIMALS } from '../domain/model/decimal-quantity.js';

// local part, "@", domain with at least one dot and a 2+ letter top-level domain (e.g. ana@resto.pe).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-zA-Z]{2,}$/;
const PHONE_PATTERN = /^\+?[\d\s-]{6,20}$/;

/** Minimum length of a new password. */
export const PASSWORD_MIN_LENGTH = 8;

/** @type {ValidationRule} */
export function required(value) {
  return value === null || value === undefined || String(value).trim() === '' ? { code: 'validation.required' } : null;
}

/** @type {ValidationRule} */
export function email(value) {
  return required(value) ?? (EMAIL_PATTERN.test(String(value).trim()) ? null : { code: 'validation.email' });
}

/**
 * @param {number} min
 * @returns {ValidationRule}
 */
export function minLength(min) {
  return (value) => (String(value ?? '').trim().length >= min ? null : { code: 'validation.min-length', params: { min } });
}

/**
 * Accepts empty values; use together with {@link required} when the field is mandatory.
 *
 * @param {number} min
 * @returns {ValidationRule}
 */
export function optionalMinLength(min) {
  return (value) => (!value ? null : minLength(min)(value));
}

/**
 * @param {number} min
 * @returns {ValidationRule}
 */
export function minValue(min) {
  return (value) => (value === null || value === undefined || Number(value) < min ? { code: 'validation.min-value', params: { min } } : null);
}

/**
 * Password strength for new passwords: at least 8 characters with letters and numbers.
 *
 * @type {ValidationRule}
 */
export function strongPassword(value) {
  const text = String(value ?? '');
  if (required(text)) return { code: 'validation.required' };
  if (text.length < PASSWORD_MIN_LENGTH || !/[A-Za-z]/.test(text) || !/\d/.test(text)) {
    return { code: 'validation.password-strength', params: { min: PASSWORD_MIN_LENGTH } };
  }
  return null;
}

/**
 * The value must be equal to another field (e.g. "confirm password").
 *
 * @param {() => unknown} getOther returns the value to compare with
 * @param {string} [code] i18n key of the message
 * @returns {ValidationRule}
 */
export function matches(getOther, code = 'validation.passwords-match') {
  return (value) => (String(value ?? '') === String(getOther() ?? '') ? null : { code });
}

/** Optional phone number (digits, spaces, dashes and a leading "+"). @type {ValidationRule} */
export function optionalPhone(value) {
  return !value || PHONE_PATTERN.test(String(value).trim()) ? null : { code: 'validation.phone' };
}

/**
 * Quantity with up to 32 decimals written as text (e.g. "0.125" or "0,125").
 *
 * @param {{positive?: boolean}} [options] `positive` rejects zero
 * @returns {ValidationRule}
 */
export function decimalQuantity({ positive = false } = {}) {
  return (value) => {
    if (required(value)) return { code: 'validation.required' };
    if (!DecimalQuantity.isValidText(value)) return { code: 'validation.decimal', params: { max: MAX_QUANTITY_DECIMALS } };
    if (positive && DecimalQuantity.of(value).lte(0)) return { code: 'validation.positive' };
    return null;
  };
}

/**
 * Runs the rules of every field and keeps the first failing message per field.
 *
 * @param {Record<string, unknown>} form
 * @param {Record<string, ValidationRule[]>} rules
 * @returns {Record<string, ValidationMessage>}
 */
export function validate(form, rules) {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const message = rule(form[field]);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
}
