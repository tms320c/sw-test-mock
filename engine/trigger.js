const { handle } = require('./handler')
const { getAllContexts, getForWorker } = require('./pool')

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
  getTrigger,
  getSWPostMessage,
}
