'use strict'

const { handle, mixin } = require('../engine/handler')

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

  // addEventListener(type, listener, options) {
  //   if (['message', 'messageerror'].indexOf(type) > -1) {
  //     this[`on${type}`] = listener
  //   }
  // }
  //
  // removeEventListener(type, callback, options) {
  //   const cb = `on${type}`
  //   this[cb] = this[cb] === callback ? null : this[cb]
  // }

  dispatchEvent(evt) {
    return !evt.cancelable
  }
}
