const path = require('path')
const fs = require('fs')
const vm = require('vm')

const { handle } = require('../lib/events')
const createContext = require('../lib/createContext')
const { fetchFactory } = require('../lib/fetchFactory')
const importScripts = require('../lib/importScripts')
const ServiceWorker = require('../lib/ServiceWorker')
const ServiceWorkerGlobalScope = require('../lib/ServiceWorkerGlobalScope')
const ServiceWorkerRegistration = require('../lib/ServiceWorkerRegistration')

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
      container.scope.clients._connect(container._url, clientPostMessage.bind(null, container))
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

const getSWPostMessage = (container) => {
  /**
   * Send 'message' to active ServiceWorker
   * @param {*} message
   * @param {Array} transferList
   * @returns {void}
   * */
  const trigger = getTrigger(container)
  return (message, transferList) => trigger('message', message, transferList).then()
}

/**
 * Send 'message' to client listeners
 * @param {ServiceWorkerContainer} container
 * @param {*} message
 * @param {Array} transferList
 * @returns {void}
 */
const clientPostMessage = (container, message, transferList) => {
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

const getTrigger =
  (container) =>
  /**
   * Trigger 'eventType' in current scope
   * @param {String} eventType
   * @param args
   * @returns {Promise}
   */
  async (eventType, ...args) => {
    // TODO: fully qualify 'fetch' event urls
    const context = [...getAllContexts()].find((v, i, a) => v.sw === container._sw)

    if (!context) {
      throw Error('no script registered yet')
    }

    const containers = getForWorker(context.sw)

    switch (eventType) {
      case 'install':
        setState('installing', context, containers)
        break
      case 'activate':
        setState('activating', context, containers)
        break
      default:
      // No state mgmt necessary
    }

    const done = (evType) => {
      switch (evType) {
        case 'install':
          setState('installed', context, containers)
          break
        case 'activate':
          setState('activated', context, containers)
          break
        default:
        // No state mgmt necessary
      }
    }

    return handle(context.scope, eventType, ...args).then((result) => {
      done(eventType)
      return result
    })
  }

/**
 * Store 'state'
 * @param {String} state
 * @param {Object} context
 * @param {Array} containers
 * @returns {void}
 */
const setState = (state, context, containers) => {
  // TODO: emit serviceworker.onstatechange events
  switch (state) {
    case 'installing':
      if (context.sw.state !== 'installing') {
        return
      }
      context.registration._installing = context.sw
      setControllerForContainers(null, containers)
      break
    case 'installed':
      context.sw.state = state
      context.registration._installing = null
      context.registration._waiting = context.sw
      break
    case 'activating':
      if (!context.sw.state.includes('install')) {
        throw Error('ServiceWorker not yet installed')
      }
      context.sw.state = state
      context.registration._activating = context.sw
      setControllerForContainers(null, containers)
      break
    case 'activated':
      context.sw.state = state
      context.registration._waiting = null
      context.registration._active = context.sw
      setControllerForContainers(context.sw, containers)
      break
    default:
      if (context.sw.state !== 'activated') {
        throw Error('ServiceWorker not yet active')
      }
  }
}

/**
 * Set 'controller' for 'containers'
 * @param {ServiceWorker} controller
 * @param {Array} containers
 * @returns {void}
 */
const setControllerForContainers = (controller, containers) => {
  for (const container of containers) {
    container.controller = controller
  }
}

module.exports = {
  getRegister,
  getTrigger,
  getUnregister,
}
