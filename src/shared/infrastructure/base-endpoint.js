/**
 * Standard CRUD operations over one REST resource of the StockIA API.
 *
 * @remarks
 * Updates send the complete resource with PUT (json-server replaces the whole
 * record), so callers always merge their changes over the current entity.
 */
export class BaseEndpoint {
  /**
   * @param {import('./base-api.js').BaseApi} baseApi
   * @param {string} endpointPath resource path relative to the API base URL (e.g. '/users')
   */
  constructor(baseApi, endpointPath) {
    this.http = baseApi.http;
    this.endpointPath = endpointPath;
  }

  /**
   * @param {Record<string, unknown>} [params] query-string filters (e.g. `{ email }`)
   * @returns {Promise<import('axios').AxiosResponse<any[]>>}
   */
  getAll(params = {}) {
    return this.http.get(this.endpointPath, { params });
  }

  /**
   * @param {number|string} id
   * @returns {Promise<import('axios').AxiosResponse<any>>}
   */
  getById(id) {
    return this.http.get(`${this.endpointPath}/${id}`);
  }

  /**
   * @param {Object} resource
   * @returns {Promise<import('axios').AxiosResponse<any>>}
   */
  create(resource) {
    return this.http.post(this.endpointPath, resource);
  }

  /**
   * @param {number|string} id
   * @param {Object} resource complete resource, `id` included
   * @returns {Promise<import('axios').AxiosResponse<any>>}
   */
  update(id, resource) {
    return this.http.put(`${this.endpointPath}/${id}`, { ...resource, id });
  }

  /**
   * @param {number|string} id
   * @returns {Promise<import('axios').AxiosResponse<any>>}
   */
  delete(id) {
    return this.http.delete(`${this.endpointPath}/${id}`);
  }
}
