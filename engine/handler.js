'use strict'

const ExtendableEvent = require('../lib/events/ExtendableEvent')
const FetchEvent = require('../lib/events/FetchEvent')
const MessageEvent = require('../lib/events/MessageEvent')
const NotificationEvent = require('../lib/events/NotificationEvent')
const PushEvent = require('../lib/events/PushEvent')

/**
 * Create 'event' instance
 * @param {String} type
 * @param args
 * @returns {Event}
 */
const create = (type, ...args) => {
  switch (type) {
    case 'fetch':
      return new FetchEvent(...args)
    case 'notificationclick':
      return new NotificationEvent(...args)
    case 'push':
      return new PushEvent(...args)
    case 'message':
      return new MessageEvent('message', {
        data: args[0] ? args[0] : null,
        ports: args[1] ? args[1] : [],
        source: args[2] ? args[2] : null,
      })
    default:
      return new ExtendableEvent(type)
  }
}

/**
 * Handle event 'type' from 'source'
 * @param {Object} source
 * @param {String} type
 * @param args
 * @returns {Promise}
 */
const handle = async (source, type, ...args) => {
  const listeners = (source._listeners[type] && source._listeners[type].slice()) || []
  const onevent = source[`on${type}`]

  if (onevent) {
    listeners.push(onevent)
  }

  if ((type === 'error' || type === 'unhandledrejection') && !listeners.length) {
    throw args[0] || Error(`unhandled error of type ${type}`)
  }

  if (listeners.length === 1) {
    return doHandle(listeners[0], type, args)
  }

  return Promise.all(listeners.map((fn) => doHandle(fn, type, args)))
}

/**
 * Execute handle of 'listener'
 * @param {Function} listener
 * @param {String} type
 * @param {Array} args
 * @returns {Promise}
 */
const doHandle = async (listener, type, args) => {
  const event = create(type, ...args)
  listener(event)
  return event.promise
}

const mixin = (instance) => {
  instance._listeners = {}
  instance.addEventListener = function addEventListener(event, fn) {
    if (!instance._listeners[event]) {
      instance._listeners[event] = []
    }
    instance._listeners[event].push(fn)
  }
  instance.removeEventListener = function removeEventListener(event, fn) {
    if (!instance._listeners[event]) {
      return
    }
    instance._listeners[event].splice(instance._listeners[event].indexOf(fn), 1)
  }
}

module.exports = {
  create,
  handle,
  mixin,
}
