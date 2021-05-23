'use strict'
const { v4: uuidv4 } = require('uuid')

module.exports = class Client {
  /**
   * Constructor
   * @param {String} url
   * @param {Function} postMessage
   */
  constructor(url, postMessage = () => {}) {
    this.id = uuidv4()
    this.type = 'window'
    this.url = url
    this.postMessage = postMessage
  }
}
