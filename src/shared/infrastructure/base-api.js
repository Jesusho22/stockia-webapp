import axios from 'axios';
import { getAccessToken } from './session-storage.js';

const platformApi = import.meta.env.VITE_STOCKIA_API_URL;

/** Event raised when the API rejects the token (expired or invalid session). */
export const SESSION_EXPIRED_EVENT = 'stockia:session-expired';

/**
 * Shared HTTP client for the StockIA Platform API (ASP.NET Core).
 *
 * @remarks
 * Each Bounded Context extends this class in its infrastructure layer and
 * declares one {@link BaseEndpoint} per resource. Every request carries the
 * JWT of the session; a 401 on a protected endpoint raises
 * {@link SESSION_EXPIRED_EVENT}, which `app.vue` turns into a sign-out.
 */
export class BaseApi {
  /** @type {import('axios').AxiosInstance} */
  #http;

  constructor() {
    this.#http = axios.create({
      baseURL: platformApi,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    this.#http.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    this.#http.interceptors.response.use(undefined, (error) => {
      const isAuthentication = String(error?.config?.url ?? '').includes('/authentication/');
      if (error?.response?.status === 401 && !isAuthentication && getAccessToken()) {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      }
      return Promise.reject(error);
    });
  }

  /**
   * @returns {import('axios').AxiosInstance}
   */
  get http() {
    return this.#http;
  }
}
