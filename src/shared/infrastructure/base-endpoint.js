/**
 * Standard operations over one REST resource of the StockIA Platform API:
 * CRUD plus actions on a sub-path (e.g. POST /sales/7/void).
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

  /**
   * GET on a sub-path, e.g. `getPath('latest')` → GET /demand-forecasts/latest.
   *
   * @param {string} subPath
   * @returns {Promise<import('axios').AxiosResponse<any>>}
   */
  getPath(subPath) {
    return this.http.get(`${this.endpointPath}/${subPath}`);
  }

  /**
   * POST to a sub-path, e.g. `post('7/void')` or `post('sign-in', body)`.
   *
   * @param {string} subPath
   * @param {Object} [body]
   * @returns {Promise<import('axios').AxiosResponse<any>>}
   */
  post(subPath, body = {}) {
    return this.http.post(`${this.endpointPath}/${subPath}`, body);
  }

  /**
   * PATCH a sub-path, e.g. `patch('7/role', { role })`.
   *
   * @param {string} subPath
   * @param {Object} body
   * @returns {Promise<import('axios').AxiosResponse<any>>}
   */
  patch(subPath, body) {
    return this.http.patch(`${this.endpointPath}/${subPath}`, body);
  }

  /**
   * PUT to a sub-path, e.g. `put('current', body)`.
   *
   * @param {string} subPath
   * @param {Object} body
   * @returns {Promise<import('axios').AxiosResponse<any>>}
   */
  put(subPath, body) {
    return this.http.put(`${this.endpointPath}/${subPath}`, body);
  }
}
