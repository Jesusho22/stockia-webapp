import { defineStore } from 'pinia';
import { ref } from 'vue';
import { RecommendationsApi } from '../infrastructure/recommendations-api.js';
import { RecommendationAssembler } from '../infrastructure/recommendation.assembler.js';
import { Recommendation } from '../domain/model/recommendation.entity.js';

const recommendationsApi = new RecommendationsApi();

/**
 * Application layer of the ML & Recommendations Bounded Context for the
 * purchase and menu recommendations derived from the demand forecast.
 */
export const useRecommendationsStore = defineStore('recommendations', () => {
  /** @type {import('vue').Ref<Recommendation[]>} */
  const recommendations = ref([]);
  const recommendationsLoaded = ref(false);

  async function loadRecommendations() {
    const response = await recommendationsApi.getRecommendations();
    // Newest recommendations first.
    recommendations.value = RecommendationAssembler.toEntitiesFromResponse(response).sort((a, b) => Number(b.id) - Number(a.id));
    recommendationsLoaded.value = true;
  }

  /** @param {Recommendation} recommendation */
  async function applyRecommendation(recommendation) {
    const { data } = await recommendationsApi.applyRecommendation(recommendation.id);
    const applied = RecommendationAssembler.toEntityFromResource(data);
    recommendations.value = recommendations.value.map((candidate) => (candidate.id === applied.id ? applied : candidate));
  }

  return { recommendations, recommendationsLoaded, loadRecommendations, applyRecommendation };
});
