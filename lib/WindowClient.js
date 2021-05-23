'use strict'
const { v4: uuidv4 } = require('uuid')
const Client = require('./Client')

module.exports = class WindowClient extends Client {
  /**
   * Constructor
   * @param {String} url
   * @param {Function} postMessage
   */
  constructor(url, postMessage = () => {}) {
    super(url, postMessage)
    this.focused = false
    this.visibilityState = 'hidden'
  }

  async focus() {
    this.focused = true
    this.visibilityState = 'visible'
    return this
  }

  async navigate(url) {
    this.url = url
    return this
  }
}
