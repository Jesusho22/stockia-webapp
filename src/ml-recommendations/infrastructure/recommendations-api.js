import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const recommendationsEndpointPath = import.meta.env.VITE_RECOMMENDATIONS_ENDPOINT_PATH;

/**
 * Infrastructure adapter of the ML & Recommendations Bounded Context for the
 * purchase and menu recommendations that every new forecast generates
 * (Menu Recommendation Engine). Administrator only.
 */
export class RecommendationsApi extends BaseApi {
  #recommendationsEndpoint;

  constructor() {
    super();
    this.#recommendationsEndpoint = new BaseEndpoint(this, recommendationsEndpointPath);
  }

  getRecommendations() { return this.#recommendationsEndpoint.getAll(); }
  /** @param {number} id */
  applyRecommendation(id) { return this.#recommendationsEndpoint.post(`${id}/apply`); }
}
