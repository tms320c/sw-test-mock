const ServiceWorkerContainer = require('../lib/ServiceWorkerContainer')

module.exports = class ContainerFactory {
  static _pool = new Set()
  // static _pool = new Map()
  static _cache = new Map()

  static _contexts = new Map()

  /**
   *
   * @param {String} url
   * @param {String} webroot
   * @param register
   * @param trigger
   * @returns {ServiceWorkerContainer|any}
   */
  static get(url, webroot, register, trigger) {
    // const key = `${url}${webroot}`
    // if (this._pool.has(key)) {
    //   return this._pool.get(key)
    // }
    const container = new ServiceWorkerContainer(url, webroot, register, trigger)
    // this._pool.set(key, container)
    this._pool.add(container)
    this._cache.clear()
    return container
  }

  static getForScope(urlScope) {
    return this._getForPredicate(urlScope, (v, i, a) => v._url.indexOf(urlScope) === 0)
  }

  static getForWorker(sw) {
    return this._getForPredicate(sw, (v, i, a) => v._sw === sw)
  }

  static _getForPredicate(key, predicate) {
    if (!this._cache.has(key)) {
      const containers = [...this._pool.values()].filter((v, i, a) => predicate(v, i, a))
      this._cache.set(key, containers)
      return containers
    }
    return this._cache.get(key)
  }

  static hasContext(urlScope) {
    return this._contexts.has(urlScope)
  }

  static addContext(urlScope, ctx) {
    this._contexts.set(urlScope, ctx)
  }

  static getContext(urlScope) {
    return this._contexts.get(urlScope)
  }

  static removeContext(urlScope) {
    this._contexts.delete(urlScope)
  }

  static getContextForContainer(container) {
    for (const context of this._contexts.values()) {
      if (context.sw === container._sw) {
        return context
      }
    }
    return null
  }

  static destroyAll() {
    for (let container of this._pool.values()) {
      container._destroy()
    }
    this._pool.clear()

    for (const context of this._contexts.values()) {
      context.registration._destroy()
      context.sw._destroy()
      context.scope._destroy()
    }
    this._contexts.clear()
  }
}
