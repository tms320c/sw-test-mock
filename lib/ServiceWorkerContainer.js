'use strict'

const { mixin } = require('./events')
const { v4: uuidv4 } = require('uuid')

module.exports = class ServiceWorkerContainer {
  /**
   * Constructor
   * @param {String} url
   * @param {String} webroot
   */
  constructor(url, webroot) {
    this._destroy()
    this._url = url
    this._webroot = webroot
    this.id = uuidv4()
    mixin(this)
  }

  /**
   * Retrieve ServiceWorkerRegistration when active
   * Will trigger install/activate lifecycle
   * @returns {Promise<ServiceWorkerRegistration>}
   */
  get ready() {
    if (!this._registration) {
      throw Error('no script registered yet in container')
    }
    if (this.controller) {
      return Promise.resolve(this._registration)
    }
    return this.trigger('install')
      .then(() => this.trigger('activate'))
      .then(() => this._registration)
  }

  /**
   * Retrieve current ServiceWorker registration
   * @param {String} [scope]
   * @returns {Promise<ServiceWorkerRegistration>}
   */
  async getRegistration(scope) {
    return this._registration
  }

  /**
   * Retrieve all current ServiceWorker registrations
   * @returns {Promise<Array>}
   */
  async getRegistrations() {
    return [this._registration]
  }

  get scope() {
    return this._scope
  }

  set scope(value) {
    this._scope = value
  }

  _destroy() {
    this.controller = null
    this.register = null
    this.trigger = null
    this._scope = null
    this.api = null
    this._registration = null
    this._sw = null
    this._url = null
    this._webroot = null
    this._listeners = null
    this.id = 'NOPE'
  }
}
