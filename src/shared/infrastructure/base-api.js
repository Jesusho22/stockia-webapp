import axios from 'axios';

const platformApi = import.meta.env.VITE_STOCKIA_API_URL;

/**
 * Shared HTTP client for the StockIA API.
 *
 * @remarks
 * Each Bounded Context extends this class in its infrastructure layer and
 * declares one {@link BaseEndpoint} per resource. When the ASP.NET Core
 * RESTful API replaces the json-server mock API, only `VITE_STOCKIA_API_URL`
 * changes; no presentation component is touched.
 */
export class BaseApi {
  /** @type {import('axios').AxiosInstance} */
  #http;

  constructor() {
    this.#http = axios.create({
      baseURL: platformApi,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
  }

  /**
   * @returns {import('axios').AxiosInstance}
   */
  get http() {
    return this.#http;
  }
}
