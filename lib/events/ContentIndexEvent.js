'use strict'

const ExtendableEvent = require('./ExtendableEvent')

module.exports = class ContentIndexEvent extends ExtendableEvent {
  /**
   * Constructor
   * @param {Object} data
   */
  constructor(data) {
    super()
    this.data = data
  }
  get id() {
    return ''
  }
}
