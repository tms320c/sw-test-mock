const path = require('path')
const fs = require('fs')
const vm = require('vm')

const { handle } = require('../lib/events')
const createContext = require('./createContext')
const { fetchFactory } = require('./fetchFactory')
const importScripts = require('./importScripts')
const ServiceWorker = require('../lib/ServiceWorker')
const ServiceWorkerGlobalScope = require('../lib/ServiceWorkerGlobalScope')
const ServiceWorkerRegistration = require('../lib/ServiceWorkerRegistration')

const { getSWPostMessage } = require('./trigger')

const DEFAULT_SCOPE = './'

const DEFAULT_PERMISSIONS_QUERY = async (permissionDesc) => {
  return {
    get state() {
      return permissionDesc && permissionDesc.name === 'notifications' ? 'granted' : 'denied'
    },
    onchange: (evt) => console.log('PERMISSIONS CHANGED', evt),
  }
}

const {
  hasContext,
  getContext,
  removeContext,
  getAllContexts,
  addContext,
  addContainer,
  getForScope,
  getForWorker,
  destroyAllContainers,
} = require('./pool')

const getRegister =
  (container) =>
  /**
   * Register ServiceWorker script at 'scriptURL'
   * @param {String} scriptURL
   * @param {Function} permissionQuery
   * @param {Object} [options]
   *  - {String} scope
   * @returns {Promise<ServiceWorkerRegistration>}
   */
  (scriptURL, { scope = DEFAULT_SCOPE } = {}, permissionQuery = DEFAULT_PERMISSIONS_QUERY) => {
    const origin = new URL(container._url).origin
    const urlScope = new URL(scope, origin).href

    if (!hasContext(urlScope)) {
      if (scriptURL.charAt(0) === '/') {
        scriptURL = scriptURL.slice(1)
      }
      const webroot = container._webroot
      const isPath = !~scriptURL.indexOf('\n')
      const contextPath = isPath ? getResolvedPath(webroot, scriptURL) : findRootTestDir()
      const contextLocation = new URL(
        path.join(isPath ? scriptURL : 'sw.js').replace(/:\//, '://'),
        origin
      )

      const fetch = fetchFactory(origin)
      const registration = new ServiceWorkerRegistration(urlScope)
      registration.unregister = getUnregister(urlScope)

      const globalScope = new ServiceWorkerGlobalScope(registration, fetch, origin)
      const sw = new ServiceWorker(isPath ? scriptURL : '')
      sw.postMessage = getSWPostMessage(container)

      let script = isPath
        ? fs.readFileSync(
            isRelativePath(scriptURL) ? path.resolve(webroot, scriptURL) : scriptURL,
            'utf8'
          )
        : scriptURL
      script = importScripts(script, container._webroot)
      // contextLocation.origin = origin;
      contextLocation._webroot = container._webroot
      const ctx = createContext(
        globalScope,
        contextLocation,
        contextPath,
        origin,
        fetch,
        permissionQuery
      )

      const sandbox = vm.createContext(ctx)

      vm.runInContext(script, sandbox)

      addContext(urlScope, {
        api: ctx.module.exports,
        registration,
        scope: sandbox,
        sw,
      })
    }

    const context = getContext(urlScope)

    getForScope(urlScope).forEach((container) => {
      container._registration = context.registration
      container._sw = context.sw
      container.api = context.api
      container.scope = context.scope
      // Create client for container
      container.scope.clients._connect(container._url, getClientPostMessage(container))
    })

    return Promise.resolve(container._registration)
  }

const getUnregister = (urlScope) => {
  return async () => {
    const context = getContext(urlScope)
    if (!context) {
      return false
    }
    getForWorker(context.sw).forEach((container) => {
      container._registration = null
      container._sw = null
      container.api = null
      container.scope = null
      container.controller = null
    })
    context.registration._destroy()
    context.sw._destroy()
    context.scope._destroy()
    removeContext(urlScope)
    return true
  }
}

const getClientPostMessage =
  (container) =>
  /**
   * Send 'message' to client listeners
   * @param {*} message
   * @param {Array} transferList
   * @returns {void}
   */
  (message, transferList) => {
    handle(container, 'message', message, transferList, container.controller).then()
  }

/**
 * Retrieve the fully resolved path
 * @param {String} contextPath
 * @param {String} p
 * @returns {String}
 */
const getResolvedPath = (contextPath, p) => {
  return isRelativePath(p) ? path.resolve(contextPath, p) : p
}

/**
 * Determine if 'p' is relative path
 * @param {String} p
 * @returns {Boolean}
 */
const isRelativePath = (p) => {
  return !path.isAbsolute(p)
}

const findRootTestDir = () => {
  let main = module.parent
  let dir = ''
  // const moduleParents = Object.values(require.cache)
  //   .filter((m) => m.children.includes(module))
  while (main) {
    dir = path.dirname(main.filename)
    main = !main.parent || main.parent.filename.includes('node_modules') ? null : main.parent
  }

  return dir
}

module.exports = {
  getRegister,
  getUnregister,
}
