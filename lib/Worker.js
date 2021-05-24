'use strict'

const { mixin } = require('../engine/handler')

module.exports = class Worker extends EventTarget {
  /**
   * Constructor
   * @param {String} scriptURL
   * @param options
   */
  constructor(
    scriptURL,
    options = {
      type: 'classic',
      credentials: 'omit',
      name: 'test',
    }
  ) {
    super()
    this.scriptURL = scriptURL
    this.postMessage = () => {}
    this.terminate = () => {}
    Object.assign(this, options)
    mixin(this)
  }
}
