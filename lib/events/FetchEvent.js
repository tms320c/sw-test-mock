'use strict'

const { contentType } = require('mime-types')
const path = require('path')
const Request = require('../Request')

module.exports = class FetchEvent extends Event {
  /**
   * Constructor
   * @param {Request|String} request
   */
  constructor(request) {
    super('fetch')

    // TODO: clientId/isReload
    if (typeof request === 'string') {
      request = new Request(request, {
        headers: {
          accept: contentType(path.extname(request.split('?')[0]) || 'html'),
        },
      })
    }
    this.request = request
  }

  /**
   * Store response
   * @param {Promise} promise
   * @returns {void}
   */
  respondWith(promise) {
    this.promise = promise
  }
}
