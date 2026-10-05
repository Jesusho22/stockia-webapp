/**
 * @typedef {Object} ForecastDataPoint
 * @property {string} date yyyy-mm-dd
 * @property {string} dayLabel
 * @property {string} dishName
 * @property {number} projectedUnits
 */

/**
 * @typedef {Object} DemandForecastProps
 * @property {number} [id]
 * @property {string} [generatedAt]
 * @property {number} [confidenceScore] between 0 and 1
 * @property {string} [weatherCondition]
 * @property {ForecastDataPoint[]} [dataPoints]
 */

/**
 * Aggregate root of the Demand Forecasting Bounded Context: projected units
 * per day for the next seven days.
 *
 * @remarks
 * ConfidenceScore, WeatherCondition and DateRange are represented as fields
 * of the aggregate in this Sprint.
 */
export class DemandForecast {
  /**
   * @param {DemandForecastProps} [props]
   */
  constructor({ id = 0, generatedAt = '', confidenceScore = 0, weatherCondition = '', dataPoints = [] } = {}) {
    this.id = id;
    this.generatedAt = generatedAt;
    this.confidenceScore = Number(confidenceScore);
    this.weatherCondition = weatherCondition;
    this.dataPoints = dataPoints.map((point) => ({ ...point, projectedUnits: Number(point.projectedUnits) }));
  }

  /** @returns {number} highest projected units of the period (at least 1) */
  get maxProjectedUnits() {
    return Math.max(1, ...this.dataPoints.map((point) => point.projectedUnits));
  }

  /** @returns {number} total projected units of the period */
  get totalProjectedUnits() {
    return this.dataPoints.reduce((sum, point) => sum + point.projectedUnits, 0);
  }
}
