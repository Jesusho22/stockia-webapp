import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { AlertsApi } from '../infrastructure/alerts-api.js';
import { AlertAssembler } from '../infrastructure/alert.assembler.js';
import { Alert } from '../domain/model/alert.entity.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';
import { toBusinessRuleError } from '../../shared/infrastructure/api-error.js';

const alertsApi = new AlertsApi();

/**
 * Application layer of the Notifications & Messaging Bounded Context.
 */
export const useAlertsStore = defineStore('alerts', () => {
  /** @type {import('vue').Ref<Alert[]>} */
  const alerts = ref([]);
  const alertsLoaded = ref(false);

  const pendingCount = computed(() => alerts.value.filter((alert) => !alert.acknowledged).length);
  // Newest first: by creation date, then by id (the API assigns increasing ids).
  const recentAlerts = computed(() => [...alerts.value].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || Number(b.id) - Number(a.id)));

  async function loadAlerts() {
    const response = await alertsApi.getAlerts();
    alerts.value = AlertAssembler.toEntitiesFromResponse(response);
    alertsLoaded.value = true;
  }

  /** @param {Alert} alert */
  function replace(alert) {
    alerts.value = alerts.value.map((candidate) => (candidate.id === alert.id ? alert : candidate));
  }

  /**
   * Creates an alert manually. The API sends it by its main channel (first delivery attempt).
   *
   * @param {{type: string, severity: string, message: string, channel: string}} form
   */
  async function createAlert({ type, severity, message, channel }) {
    await alertsApi.createAlert({ type, severity, message: message.trim(), channel });
    await loadAlerts();
  }

  /**
   * @param {Alert} current
   * @param {{type: string, severity: string, message: string, channel: string}} form
   */
  async function updateAlert(current, { type, severity, message, channel }) {
    const { data } = await alertsApi.updateAlert(current.id, { type, severity, message: message.trim(), channel });
    replace(AlertAssembler.toEntityFromResource(data));
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
    try {
      const { data } = await alertsApi.acknowledgeAlert(alert.id);
      replace(AlertAssembler.toEntityFromResource(data));
    } catch (error) {
      throw toBusinessRuleError(error, { NotDelivered: 'alerts.errors.not-delivered' });
    }
  }

  /**
   * New delivery attempt on the pending channel (done by the API).
   *
   * @param {Alert} alert
   * @returns {Promise<string|null>} channel delivered in this attempt
   */
  async function retryDelivery(alert) {
    const channel = alert.pendingChannel;
    if (!channel) return null;
    const { data } = await alertsApi.retryDelivery(alert.id);
    replace(AlertAssembler.toEntityFromResource(data));
    return channel;
  }


  return {
    alerts, alertsLoaded, pendingCount, recentAlerts,
    loadAlerts, createAlert, updateAlert, deleteAlert, acknowledge, retryDelivery,
  };
});
