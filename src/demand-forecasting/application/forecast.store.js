import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ForecastApi } from '../infrastructure/forecast-api.js';
import { DemandForecastAssembler } from '../infrastructure/demand-forecast.assembler.js';
import { DemandForecast } from '../domain/model/demand-forecast.entity.js';
import { toBusinessRuleError } from '../../shared/infrastructure/api-error.js';

const forecastApi = new ForecastApi();

/**
 * Application layer of the Demand Forecasting Bounded Context.
 *
 * @remarks
 * `generate` asks the StockIA Platform API for a new 7-day forecast
 * (ForecastGenerationService): an ONNX model trained in Python predicts the
 * units of each dish from the sales history, holidays, paydays and the
 * weather forecast. Each new forecast also refreshes the recommendations.
 */
export const useForecastStore = defineStore('forecast', () => {
  /** @type {import('vue').Ref<DemandForecast[]>} */
  const forecasts = ref([]);
  const loaded = ref(false);

  /** Most recent forecast by generation date. */
  const latest = computed(() => [...forecasts.value].sort((a, b) => String(a.generatedAt).localeCompare(String(b.generatedAt))).at(-1) ?? null);

  async function loadForecasts() {
    const response = await forecastApi.getDemandForecasts();
    forecasts.value = DemandForecastAssembler.toEntitiesFromResponse(response);
    loaded.value = true;
  }

  /**
   * Generates a new seven-day forecast.
   *
   * @returns {Promise<DemandForecast>}
   */
  async function generate() {
    try {
      const response = await forecastApi.generateDemandForecast(7);
      const created = DemandForecastAssembler.toEntityFromResource(response.data);
      forecasts.value = [created, ...forecasts.value];
      return created;
    } catch (error) {
      throw toBusinessRuleError(error, { NoDishes: 'forecast.errors.no-dishes' });
    }
  }

  return { forecasts, loaded, latest, loadForecasts, generate };
});
