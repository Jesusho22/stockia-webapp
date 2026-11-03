import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { AlertsApi } from '../infraestructure/alerts-api.js';
import { AlertAssembler } from '../infraestructure/alert.assembler.js';
import { RecommendationAssembler } from '../infraestructure/recommendation.assembler.js';
import { Alert } from '../domain/model/alert.entity.js';
import { Recommendation } from '../domain/model/recommendation.entity.js';
import { BusinessRuleError } from '../../shared/domain/model/business-rule-error.js';

const alertsApi = new AlertsApi();

export const useAlertsStore = defineStore('alerts', () => {

    const alerts = ref([]);
    const recommendations = ref([]);
    const alertsLoaded = ref(false);
    const recommendationsLoaded = ref(false);

    const pendingCount = computed(() => alerts.value.filter((alert) => !alert.acknowledged).length);

    const recentAlerts = computed(() => [...alerts.value].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || Number(b.id) - Number(a.id)));

    async function loadAlerts() {
        const response = await alertsApi.getAlerts();
        alerts.value = AlertAssembler.toEntitiesFromResponse(response);
        alertsLoaded.value = true;
    }

    async function persist(alert) {
        await alertsApi.updateAlert(alert.id, AlertAssembler.toResourceFromEntity(alert));
        alerts.value = alerts.value.map((candidate) => (candidate.id === alert.id ? alert : candidate));
    }

    async function createAlert({ type, severity, message, channel }) {
        const alert = new Alert({ type, severity, message: message.trim(), channel, createdAt: new Date().toISOString(), acknowledged: false, deliveredChannels: [channel] });
        const resource = AlertAssembler.toResourceFromEntity(alert);
        delete resource.id;
        await alertsApi.createAlert(resource);
        await loadAlerts();
    }

    async function updateAlert(current, { type, severity, message, channel }) {
        await persist(new Alert({ ...current, type, severity, message: message.trim(), channel }));
    }

    async function deleteAlert(alert) {
        await alertsApi.deleteAlert(alert.id);
        alerts.value = alerts.value.filter((candidate) => candidate.id !== alert.id);
    }

    async function acknowledge(alert) {
        if (!alert.delivered) throw new BusinessRuleError('notifications-messaging.errors.not-delivered');
        await persist(new Alert({ ...alert, acknowledged: true }));
    }

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