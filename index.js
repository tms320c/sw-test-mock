'use strict'
const { handle } = require('./lib/events')
const createContext = require('./lib/createContext')
const { fetchFactory } = require('./lib/fetchFactory')
const fs = require('fs')
const Headers = require('./lib/Headers')
const importScripts = require('./lib/importScripts')
const MessageChannel = require('./lib/MessageChannel')
const path = require('path')
const Request = require('./lib/Request')
const Response = require('./lib/Response')
const ServiceWorker = require('./lib/ServiceWorker')
const ServiceWorkerContainer = require('./lib/ServiceWorkerContainer')
const ServiceWorkerGlobalScope = require('./lib/ServiceWorkerGlobalScope')
const ServiceWorkerRegistration = require('./lib/ServiceWorkerRegistration')
const vm = require('vm')

const DEFAULT_ORIGIN = 'http://localhost:3333/'
const DEFAULT_SCOPE = './'

const DEFAULT_PERMISSIONS_QUERY = async (permissionDesc) => {
  return {
    get state() {
      return permissionDesc && permissionDesc.name === 'notifications' ? 'granted' : 'denied'
    },
    onchange: (evt) => console.log('PERMISSIONS CHANGED', evt),
  }
}

const containers = new Set()
const contexts = new Map()

/**
 * Create/retrieve ServiceWorkerContainer instance for 'domain'
 * @param {String} [url]
 * @param {String} [webroot]
 * @returns {Promise<ServiceWorkerContainer>}
 */
const connect = async (url = DEFAULT_ORIGIN, webroot = process.cwd()) => {
  if (url.slice(-1) !== '/') {
    url += '/'
  }

  const container = new ServiceWorkerContainer(url, webroot, register, trigger)

  containers.add(container)
  // TODO: check if active context and apply state
  return container
}

/**
 * Destroy all active containers/contexts
 * @returns {Promise}
 */
const destroy = async () => {
  for (const container of containers) {
    container._destroy()
  }
  for (const context of contexts.values()) {
    context.registration._destroy()
    context.sw._destroy()
    context.scope._destroy()
  }
  containers.clear()
  contexts.clear()
}

module.exports = {
  Headers,
  MessageChannel,
  Request,
  Response,
  connect,
  destroy,
}

/**
 * Register ServiceWorker script at 'scriptURL'
 * @param {ServiceWorkerContainer} container
 * @param {String} scriptURL
 * @param {Function} permissionQuery
 * @param {Object} [options]
 *  - {String} scope
 * @returns {Promise<ServiceWorkerRegistration>}
 */
const register = (
  container,
  scriptURL,
  { scope = DEFAULT_SCOPE } = {},
  permissionQuery = DEFAULT_PERMISSIONS_QUERY
) => {
  if (scriptURL.charAt(0) === '/') {
    scriptURL = scriptURL.slice(1)
  }
  const origin = getOrigin(container._url)
  const urlScope = new URL(scope, origin).href
  const webroot = container._webroot

  if (!contexts.has(urlScope)) {
    const isPath = !~scriptURL.indexOf('\n')
    const contextPath = isPath ? getResolvedPath(webroot, scriptURL) : findRootTestDir()
    const contextLocation = new URL(
      path.join(isPath ? scriptURL : 'sw.js').replace(/:\//, '://'),
      origin
    )

    const fetch = fetchFactory(origin)
    const registration = new ServiceWorkerRegistration(urlScope, unregister.bind(null, urlScope))

    const globalScope = new ServiceWorkerGlobalScope(registration, fetch, origin)
    const sw = new ServiceWorker(isPath ? scriptURL : '', swPostMessage.bind(null, container))

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

    contexts.set(urlScope, {
      api: ctx.module.exports,
      registration,
      scope: sandbox,
      sw,
    })
  }

  const context = contexts.get(urlScope)

  getContainersForUrlScope(urlScope).forEach((container) => {
    container._registration = context.registration
    container._sw = context.sw
    container.api = context.api
    container.scope = context.scope

    // Create client for container
    container.scope.clients._connect(container._url, clientPostMessage.bind(null, container))
  })

  return Promise.resolve(container._registration)
}

/**
 * Unregister a ServiceWorker registration
 * @param {String} contextKey
 * @returns {Promise<Boolean>}
 */
const unregister = async (contextKey) => {
  const context = contexts.get(contextKey)

  if (!context) {
    return false
  }

  getContainersForContext(context).forEach((container) => {
    container._registration = null
    container._sw = null
    container.api = null
    container.scope = null
    container.controller = null
  })

  context.registration._destroy()
  context.sw._destroy()
  context.scope._destroy()

  contexts.delete(contextKey)

  return true
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
 * Send 'message' to active ServiceWorker
 * @param {ServiceWorkerContainer} container
 * @param {*} message
 * @param {Array} transferList
 * @returns {void}
 * */
const swPostMessage = (container, message, transferList) => {
  trigger(container, 'message', message, transferList).then()
}

/**
 * Trigger 'eventType' in current scope
 * @param {ServiceWorkerContainer} container
 * @param {String} eventType
 * @param args
 * @returns {Promise}
 */
const trigger = async (container, eventType, ...args) => {
  // TODO: fully qualify 'fetch' event urls
  const context = getContextForContainer(container)

  if (!context) {
    throw Error('no script registered yet')
  }

  const containers = getContainersForContext(context)

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

/**
 * Retrieve all containers associated with 'context'
 * @param {Object} context
 * @returns {Array}
 */
const getContainersForContext = (context) => {
  const results = []

  for (const container of containers) {
    if (container._sw === context.sw) {
      results.push(container)
    }
  }

  return results
}

/**
 * Retrieve all containers that fall under 'urlScope'
 * @param {String} urlScope
 * @returns {Array}
 */
const getContainersForUrlScope = (urlScope) => {
  const results = []

  for (const container of containers) {
    if (container._url.indexOf(urlScope) === 0) {
      results.push(container)
    }
  }

  return results
}

/**
 * Retrieve context for 'container'
 * @param {ServiceWorkerContainer} container
 * @returns {Object}
 */
const getContextForContainer = (container) => {
  for (const context of contexts.values()) {
    if (context.sw === container._sw) {
      return context
    }
  }
  return null
}

/**
 * Retrieve origin from 'urlString'
 * @param {String} urlString
 * @returns {String}
 */
const getOrigin = (urlString) => {
  return new URL(urlString).origin
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
