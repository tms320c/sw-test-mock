'use strict'
const Headers = require('./lib/Headers')
const MessageChannel = require('./lib/MessageChannel')
const Request = require('./lib/Request')
const Response = require('./lib/Response')

const ContainerFactory = require('./engine/ContainerFactory')

const DEFAULT_ORIGIN = 'http://localhost:3333/'

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

  const container = ContainerFactory.get(url, webroot)
  // TODO: check if active context and apply state
  return container
}

/**
 * Destroy all active containers/_contexts
 * @returns {Promise}
 */
const destroy = async () => {
  ContainerFactory.destroyAll()
}

module.exports = {
  Headers,
  MessageChannel,
  Request,
  Response,
  connect,
  destroy,
}
