/**
 * @typedef {Object} SavingsLine
 * @property {string} itemName
 * @property {string} unit
 * @property {number} quantity
 * @property {number} value soles
 */

/**
 * Weekly savings of the restaurant (Analytics & Dashboard, Weekly Savings
 * Calculator of the API). The week is the last 7 days including today.
 *
 * @remarks
 * - Rescued value: stock used by sales in its last days before expiring.
 * - Waste value: lots that expired during the week while still holding stock.
 * - Estimated savings = rescued value + the reduction of the waste against
 *   the previous week (only when it went down).
 */
export class WeeklySavings {
  constructor({
    from = '', to = '', estimatedSavings = 0, rescuedValue = 0, previousRescuedValue = 0, wasteValue = 0, previousWasteValue = 0,
    wasteReduction = 0, confirmedSales = 0, portionsSold = 0, revenue = 0, previousRevenue = 0, projectedUnitsNextWeek = 0,
    forecastConfidence = null, topRescued = [], wasted = [],
  } = {}) {
    this.from = from;
    this.to = to;
    this.estimatedSavings = Number(estimatedSavings);
    this.rescuedValue = Number(rescuedValue);
    this.previousRescuedValue = Number(previousRescuedValue);
    this.wasteValue = Number(wasteValue);
    this.previousWasteValue = Number(previousWasteValue);
    this.wasteReduction = Number(wasteReduction);
    this.confirmedSales = confirmedSales;
    this.portionsSold = portionsSold;
    this.revenue = Number(revenue);
    this.previousRevenue = Number(previousRevenue);
    this.projectedUnitsNextWeek = projectedUnitsNextWeek;
    this.forecastConfidence = forecastConfidence;
    /** @type {SavingsLine[]} */
    this.topRescued = topRescued;
    /** @type {SavingsLine[]} */
    this.wasted = wasted;
  }

  /** @returns {boolean} the waste went down against the previous week */
  get lessWaste() {
    return this.wasteReduction > 0;
  }
}
