import { BusinessRuleError } from '../domain/model/business-rule-error.js';

/**
 * RFC 7807 problem returned by the StockIA Platform API. `title` is the error
 * code (e.g. "EmailAlreadyTaken") and `details` carries extra data (e.g. the
 * supplies that block a sale).
 *
 * @typedef {{status: number, title: string, detail: string, details?: any}} ApiProblem
 */

/**
 * @param {unknown} error axios error
 * @returns {ApiProblem|null}
 */
export function problemOf(error) {
  const response = /** @type {any} */ (error)?.response;
  if (!response) return null;
  const data = response.data ?? {};
  return { status: response.status, title: data.title ?? '', detail: data.detail ?? '', details: data.details };
}

/**
 * Turns an API error into a BusinessRuleError whose code is an i18n key, so
 * the views keep showing messages in the active language.
 *
 * @param {unknown} error
 * @param {Record<string, string>} codes API error code (problem title) → i18n key
 * @param {Record<string, unknown>} [params]
 * @returns {unknown} the BusinessRuleError, or the original error when the code is not mapped
 */
export function toBusinessRuleError(error, codes, params = {}) {
  const problem = problemOf(error);
  const key = problem ? codes[problem.title] : undefined;
  return key ? new BusinessRuleError(key, params) : error;
}
