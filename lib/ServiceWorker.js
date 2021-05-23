'use strict'

const Worker = require('./Worker')

module.exports = class ServiceWorker extends Worker {
  /**
   * Constructor
   * @param {String} scriptURL
   * @param {Function} postMessage
   */
  constructor(scriptURL, postMessage) {
    super(scriptURL)
    // installing => installed => activating => activated => redundant
    this._state = 'installing'
    this.postMessage = postMessage
  }

  set state(value) {
    if (this._state !== value) {
      this._state = value
      if (typeof this.onstatechange === 'function') {
        const evt = new Event('statechange')
        if (this.onstatechange.constructor.name === 'AsyncFunction') {
          this.onstatechange(evt).then().catch()
        } else {
          this.onstatechange(evt)
        }
      }
    }
  }

  get state() {
    return this._state
  }

  _destroy() {
    // no-op
  }
}
