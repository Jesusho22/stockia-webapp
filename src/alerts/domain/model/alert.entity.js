/**
 * Kind of alert. Display names live in `alerts.type.*`.
 *
 * @readonly
 * @enum {string}
 */
export const AlertType = Object.freeze({
  LOW_STOCK: 'LOW_STOCK',
  EXPIRING_SOON: 'EXPIRING_SOON',
  IOT_FAULT: 'IOT_FAULT',
  CRITICAL_STOCK: 'CRITICAL_STOCK',
});

/**
 * @readonly
 * @enum {string}
 */
export const AlertSeverity = Object.freeze({
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
});

/**
 * Delivery channel. Display names live in `alerts.channel.*`.
 *
 * @readonly
 * @enum {string}
 */
export const AlertChannel = Object.freeze({
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
});

/**
 * @typedef {Object} AlertProps
 * @property {number} [id]
 * @property {string} [type]
 * @property {string} [severity]
 * @property {string} [message]
 * @property {string} [createdAt]
 * @property {boolean} [acknowledged]
 * @property {string} [channel] main channel configured for the alert
 * @property {string[]} [deliveredChannels] channels with a successful delivery attempt
 */

/**
 * Aggregate root of the Alerts & Recommendations Bounded Context.
 *
 * @remarks
 * An alert counts as delivered (`AlertDelivered`) only after a successful
 * attempt on every required channel: CRITICAL alerts require WhatsApp AND
 * email; the rest only their main channel. An alert can be marked as attended
 * only once it was delivered.
 */
export class Alert {
  /**
   * @param {AlertProps} [props]
   */
  constructor({
    id = 0, type = AlertType.LOW_STOCK, severity = AlertSeverity.WARNING, message = '', createdAt = '',
    acknowledged = false, channel = AlertChannel.WHATSAPP, deliveredChannels,
  } = {}) {
    this.id = id;
    this.type = type;
    this.severity = severity;
    this.message = message;
    this.createdAt = createdAt;
    this.acknowledged = acknowledged;
    this.channel = channel;
    // Resources without delivery data assume the main channel already had its first attempt.
    this.deliveredChannels = [...(deliveredChannels ?? [channel])];
  }

  /** @returns {string[]} channels the domain requires for this severity */
  get requiredChannels() {
    return this.severity === AlertSeverity.CRITICAL ? [AlertChannel.WHATSAPP, AlertChannel.EMAIL] : [this.channel];
  }

  /** @returns {string|null} first required channel without a successful attempt */
  get pendingChannel() {
    return this.requiredChannels.find((channel) => !this.deliveredChannels.includes(channel)) ?? null;
  }

  /** @returns {boolean} delivered on every required channel */
  get delivered() {
    return this.pendingChannel === null;
  }

  /** @returns {boolean} */
  get canBeAcknowledged() {
    return !this.acknowledged && this.delivered;
  }
}
