'use strict'

const ExtendableEvent = require('./ExtendableEvent')

module.exports = class NotificationEvent extends ExtendableEvent {
  /**
   * Constructor
   * @param {string} type
   * @param {Notification} notification
   */
  constructor(type, notification) {
    super(type)
    this.notification = notification
  }
}
