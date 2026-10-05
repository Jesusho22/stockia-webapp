/**
 * Error raised when an operation breaks a business rule of the domain
 * (e.g. selling a dish without enough stock).
 *
 * @remarks
 * `code` is an i18n message key, so the presentation layer shows the error in
 * the active language with `t(error.code, error.params)`.
 */
export class BusinessRuleError extends Error {
  /**
   * @param {string} code i18n message key
   * @param {Record<string, unknown>} [params] values interpolated in the message
   */
  constructor(code, params = {}) {
    super(code);
    this.name = 'BusinessRuleError';
    this.code = code;
    this.params = params;
  }
}

/**
 * Resolves the i18n key to show for any error thrown by an application store.
 *
 * @param {unknown} error
 * @param {string} fallbackCode key used for network or unexpected errors
 * @returns {{code: string, params: Record<string, unknown>}}
 */
export function toErrorMessage(error, fallbackCode) {
  if (error instanceof BusinessRuleError) return { code: error.code, params: error.params };
  return { code: fallbackCode, params: {} };
}
