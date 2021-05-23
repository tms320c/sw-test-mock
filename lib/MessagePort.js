'use strict'

const { handle, mixin } = require('./events')

module.exports = class MessagePort extends EventTarget {
  /**
   * Constructor
   * @param {MessagePort} otherPort
   */
  constructor(otherPort) {
    super()
    this._otherPort = otherPort
    mixin(this)
  }

  /**
   * Send 'message'
   * @param {*} message
   * @param {Array} [transferList]
   * @returns {void}
   */
  postMessage(message, transferList) {
    if (this._otherPort) {
      handle(this._otherPort, 'message', message, transferList).then()
    }
  }

  /**
   * Send queued messages
   * @returns {void}
   */
  start() {
    // no-op
  }

  /**
   * Stop sending messages
   * @returns {void}
   */
  close() {
    // no-op
  }
}
