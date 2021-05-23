'use strict'
const { mixin } = require('./events')

class Notification extends EventTarget {
  /**
   * Constructor
   * @param {String} title
   * @param {Object} options
   */
  constructor(title, options) {
    super()
    this.title = title
    if (
      Object.prototype.hasOwnProperty.call(options, 'actions') &&
      Array.isArray(options.actions)
    ) {
      if (options.actions.length > Notification.maxActions) {
        options.actions = options.actions.slice(0, Notification.maxActions)
      }
    }
    Object.assign(this, options)
    mixin(this)
  }

  onclick() {} // it has default behavior

  close() {}

  // addEventListener(type, listener, options) {
  //   if (['click', 'close', 'error', 'show'].indexOf(type) > -1) {
  //     this[`on${type}`] = listener
  //   }
  // }
  //
  // removeEventListener(type, callback, options) {
  //   const cb = `on${type}`
  //   this[cb] = this[cb] === callback ? null : this[cb]
  // }

  dispatchEvent(evt) {
    return !evt.cancelable
  }
}

Notification.maxActions = 16
Notification.permission = 'default'

Notification.requestPermission = async () => {
  Notification.permission = 'granted'
  return Notification.permission
}

module.exports = Notification
