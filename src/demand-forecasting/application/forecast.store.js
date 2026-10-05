import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ForecastApi } from '../infrastructure/forecast-api.js';
import { DemandForecastAssembler } from '../infrastructure/demand-forecast.assembler.js';
import { DemandForecast } from '../domain/model/demand-forecast.entity.js';

const DISHES = ['Pizza Margarita', 'Lomo Saltado', 'Ensalada César', 'Pollo a la Brasa'];
const WEATHER = ['Soleado', 'Nublado', 'Lluvia ligera'];
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MS_PER_DAY = 86400000;

const forecastApi = new ForecastApi();

/**
 * Application layer of the Demand Forecasting Bounded Context.
 *
 * @remarks
 * `generate` simulates ForecastGenerationService with random values, because
 * there is no Machine Learning backend in this Sprint. The real service will
 * combine the sales history (Sales & Order Management) with weather data.
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
   * Generates a new seven-day projection (simulated).
   *
   * @returns {Promise<DemandForecast>}
   */
  async function generate() {
    const dataPoints = DAY_LABELS.map((dayLabel, index) => ({
      date: new Date(Date.now() + index * MS_PER_DAY).toISOString().slice(0, 10),
      dayLabel,
      dishName: DISHES[index % DISHES.length],
      projectedUnits: Math.round(20 + Math.random() * 60),
    }));
    const forecast = new DemandForecast({
      generatedAt: new Date().toISOString(),
      confidenceScore: Number((0.7 + Math.random() * 0.25).toFixed(2)),
      weatherCondition: WEATHER[Math.floor(Math.random() * WEATHER.length)],
      dataPoints,
    });
    const resource = DemandForecastAssembler.toResourceFromEntity(forecast);
    delete resource.id;
    const response = await forecastApi.createDemandForecast(resource);
    const created = DemandForecastAssembler.toEntityFromResource(response.data);
    forecasts.value = [...forecasts.value, created];
    return created;
  }

  return { forecasts, loaded, latest, loadForecasts, generate };
});
