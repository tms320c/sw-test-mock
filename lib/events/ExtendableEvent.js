'use strict'

module.exports = class ExtendableEvent extends Event {
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict)
    this.promise = null
  }

  /**
   * Wait until 'promise' resolves
   * @param {Promise} promise
   * @returns {void}
   */
  async waitUntil(promise) {
    this.promise = promise
    await promise
  }
}
