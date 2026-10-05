/**
 * Kind of recommendation. Display names live in `recommendations.type.*`.
 *
 * @readonly
 * @enum {string}
 */
export const RecommendationType = Object.freeze({
  MENU_ADJUSTMENT: 'MENU_ADJUSTMENT',
  PURCHASE_SUGGESTION: 'PURCHASE_SUGGESTION',
});

/**
 * @typedef {Object} RecommendationProps
 * @property {number} [id]
 * @property {string} [type]
 * @property {string} [message]
 * @property {string} [expectedImpact]
 * @property {boolean} [applied]
 */

/**
 * Aggregate root of the Alerts & Recommendations Bounded Context: an automatic
 * suggestion to adjust the menu or the purchases.
 */
export class Recommendation {
  /**
   * @param {RecommendationProps} [props]
   */
  constructor({ id = 0, type = RecommendationType.PURCHASE_SUGGESTION, message = '', expectedImpact = '', applied = false } = {}) {
    this.id = id;
    this.type = type;
    this.message = message;
    this.expectedImpact = expectedImpact;
    this.applied = applied;
  }
}
