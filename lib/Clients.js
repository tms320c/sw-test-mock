'use strict'

const Client = require('./Client')
const WindowClient = require('./WindowClient')

module.exports = class Clients {
  constructor() {
    this._clients = []
    this.postMessage = () => {}
  }

  /**
   * Retrieve a client matching a given id
   * @param {String} id
   * @returns {Promise<Client>}
   */
  async get(id) {
    return this._clients.find((client) => client.id === id)
  }

  /**
   * Retrieve all matching clients
   * @param {Object} options
   *  - {Boolean} includeUncontrolled
   *  - {String} type
   * @returns {Promise<[Client]>}
   */
  async matchAll(options = { includeUncontrolled: false, type: 'window' }) {
    return this._clients.filter((v, i, a) => options.type === 'any' || v.type === options.type)
  }

  /**
   * Creates a new top level browsing context and loads 'url'
   * @param {string} url
   * @returns {Promise<Client>}
   */
  async openWindow(url) {
    const client = new WindowClient(url, this.postMessage)
    this._clients.push(client)
    return client
  }

  /**
   * Activate ServiceWorker for all clients
   * @returns {Promise}
   */
  async claim() {
    // return Promise.resolve()
  }

  /**
   * Create new client on connect
   * @param {string} url
   * @param {Function} postMessage
   * @returns {void}
   */
  _connect(url, postMessage) {
    this.postMessage = postMessage
    this._clients.push(new Client(url, postMessage))
  }

  _destroy() {
    this._clients = null
    this.postMessage = () => {}
  }
}
