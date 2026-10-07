import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { AlertsApi } from '../infrastructure/alerts-api.js';
import { AlertAssembler } from '../infrastructure/alert.assembler.js';
import { RecommendationAssembler } from '../infrastructure/recommendation.assembler.js';
import { Alert } from '../domain/model/alert.entity.js';
import { Recommendation } from '../domain/model/recommendation.entity.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';

const alertsApi = new AlertsApi();

/**
 * Application layer of the Alerts & Recommendations Bounded Context.
 */
export const useAlertsStore = defineStore('alerts', () => {
  /** @type {import('vue').Ref<Alert[]>} */
  const alerts = ref([]);
  /** @type {import('vue').Ref<Recommendation[]>} */
  const recommendations = ref([]);
  const alertsLoaded = ref(false);
  const recommendationsLoaded = ref(false);

  const pendingCount = computed(() => alerts.value.filter((alert) => !alert.acknowledged).length);
  // Newest first: by creation date, then by id (the API assigns increasing ids).
  const recentAlerts = computed(() => [...alerts.value].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || Number(b.id) - Number(a.id)));

  async function loadAlerts() {
    const response = await alertsApi.getAlerts();
    alerts.value = AlertAssembler.toEntitiesFromResponse(response);
    alertsLoaded.value = true;
  }

  /** @param {Alert} alert */
  async function persist(alert) {
    await alertsApi.updateAlert(alert.id, AlertAssembler.toResourceFromEntity(alert));
    alerts.value = alerts.value.map((candidate) => (candidate.id === alert.id ? alert : candidate));
  }

  /**
   * Creates an alert manually. Its main channel counts as the first delivery attempt.
   *
   * @param {{type: string, severity: string, message: string, channel: string}} form
   */
  async function createAlert({ type, severity, message, channel }) {
    const alert = new Alert({ type, severity, message: message.trim(), channel, createdAt: new Date().toISOString(), acknowledged: false, deliveredChannels: [channel] });
    const resource = AlertAssembler.toResourceFromEntity(alert);
    delete resource.id;
    await alertsApi.createAlert(resource);
    await loadAlerts();
  }

  /**
   * @param {Alert} current
   * @param {{type: string, severity: string, message: string, channel: string}} form
   */
  async function updateAlert(current, { type, severity, message, channel }) {
    await persist(new Alert({ ...current, type, severity, message: message.trim(), channel }));
  }

  /** @param {Alert} alert */
  async function deleteAlert(alert) {
    await alertsApi.deleteAlert(alert.id);
    alerts.value = alerts.value.filter((candidate) => candidate.id !== alert.id);
  }

  /**
   * Marks an alert as attended; it must be delivered on every required channel first.
   *
   * @param {Alert} alert
   */
  async function acknowledge(alert) {
    if (!alert.delivered) throw new BusinessRuleError('alerts.errors.not-delivered');
    await persist(new Alert({ ...alert, acknowledged: true }));
  }

  /**
   * Simulates a successful new delivery attempt on the pending channel.
   *
   * @param {Alert} alert
   * @returns {Promise<string|null>} channel delivered in this attempt
   */
  async function retryDelivery(alert) {
    const channel = alert.pendingChannel;
    if (!channel) return null;
    await persist(new Alert({ ...alert, deliveredChannels: [...alert.deliveredChannels, channel] }));
    return channel;
  }

  async function loadRecommendations() {
    const response = await alertsApi.getRecommendations();
    // Newest recommendations first.
    recommendations.value = RecommendationAssembler.toEntitiesFromResponse(response).sort((a, b) => Number(b.id) - Number(a.id));
    recommendationsLoaded.value = true;
  }

  /** @param {Recommendation} recommendation */
  async function applyRecommendation(recommendation) {
    const applied = new Recommendation({ ...recommendation, applied: true });
    await alertsApi.updateRecommendation(recommendation.id, RecommendationAssembler.toResourceFromEntity(applied));
    recommendations.value = recommendations.value.map((candidate) => (candidate.id === applied.id ? applied : candidate));
  }

  return {
    alerts, recommendations, alertsLoaded, recommendationsLoaded, pendingCount, recentAlerts,
    loadAlerts, createAlert, updateAlert, deleteAlert, acknowledge, retryDelivery, loadRecommendations, applyRecommendation,
  };
});
