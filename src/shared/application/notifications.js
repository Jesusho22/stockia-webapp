import { reactive } from 'vue';

/**
 * Notifications raised outside components (for example, by the router guards
 * when a view is not allowed). `app.vue` shows them as toasts.
 *
 * @typedef {Object} AppNotification
 * @property {number} id
 * @property {'success'|'info'|'warn'|'error'} severity
 * @property {string} summary i18n key
 * @property {string} [detail] i18n key
 * @property {Record<string, unknown>} [params] values for the i18n messages
 */

let nextId = 1;

/** @type {{ items: AppNotification[] }} */
export const notificationQueue = reactive({ items: [] });

/**
 * @param {Omit<AppNotification, 'id'>} notification
 */
export function notify(notification) {
  notificationQueue.items.push({ id: nextId++, ...notification });
}

/**
 * Takes every pending notification out of the queue.
 *
 * @returns {AppNotification[]}
 */
export function drainNotifications() {
  return notificationQueue.items.splice(0, notificationQueue.items.length);
}
