const SESSION_STORAGE_KEY = 'stockia.session';

/**
 * Session of the signed-in user kept in this browser: the user data and the
 * JWT issued by the StockIA Platform API.
 *
 * @typedef {{user: Object, token: string}} StoredSession
 */

/** @type {StoredSession|null} */
let current = read();

/** @returns {StoredSession|null} */
function read() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    const session = raw ? JSON.parse(raw) : null;
    // Sessions of the old mock API had no token: they are not valid anymore.
    return session?.token && session?.user ? session : null;
  } catch {
    return null;
  }
}

/** @returns {StoredSession|null} */
export function loadSession() {
  return current;
}

/** @param {StoredSession|null} session */
export function saveSession(session) {
  current = session;
  try {
    if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* storage blocked: the session lasts until the tab is closed */
  }
}

/** @returns {string|null} bearer token for the API */
export function getAccessToken() {
  return current?.token ?? null;
}
