'use strict'

const Cache = require('./Cache')

module.exports = class CacheStorage {
  /**
   * Constructor
   * @param {Function} fetch
   * @param {String} origin
   */
  constructor(fetch, origin) {
    this._caches = new Map()
    this._fetch = fetch
    this._origin = origin
  }

  /**
   * Retrieve 'response' for matching 'request'
   * @param {Request|String} request
   * @param {Object} [options]
   *  - {Boolean} ignoreSearch
   *  - {Boolean} ignoreMethod
   *  - {Boolean} ignoreVary
   *  - {String} cacheName
   * @returns {Promise<Response>}
   */
  async match(request, options = {}) {
    if (options.cacheName) {
      const cache = this._caches.get(options.cacheName)

      if (!cache) {
        throw new Error(`cache with name '${options.cacheName}' not found`)
      }
      return cache.match(request, options)
    }

    for (const cache of this._caches.values()) {
      const results = cache._match(request, options)

      if (results.length) {
        return results[0][1]
      }
    }
  }

  /**
   * Determine if cache with 'cacheName' exists
   * @param {String} cacheName
   * @returns {Promise<Boolean>}
   */
  async has(cacheName) {
    return this._caches.has(cacheName)
  }

  /**
   * Open cache with 'cacheName'
   * Create if it doesn't exist
   * @param {String} cacheName
   * @returns {Promise<Cache>}
   */
  async open(cacheName) {
    let cache = this._caches.get(cacheName)

    if (!cache) {
      cache = new Cache(cacheName, this._fetch, this._origin)
      this._caches.set(cacheName, cache)
    }

    return cache
  }

  /**
   * Delete cache with 'cacheName'
   * @param {String} cacheName
   * @returns {Promise<Boolean>}
   */
  async delete(cacheName) {
    return this._caches.delete(cacheName)
  }

  /**
   * Retrieve all cache names
   * @returns {Promise<Array>}
   */
  async keys() {
    return Array.from(this._caches.keys())
  }

  _destroy() {
    this._caches.clear()
  }
}
