/**
 * Small validation helpers shared by the forms of the presentation layer.
 * Each rule returns `null` when the value is valid, or an i18n message
 * (`{ code, params }`) that the view renders with `t(code, params)`.
 *
 * @typedef {{code: string, params?: Record<string, unknown>}} ValidationMessage
 * @typedef {(value: any) => ValidationMessage|null} ValidationRule
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
