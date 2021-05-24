'use strict'

const Notification = require('./Notification')
const NotificationEvent = require('./events/NotificationEvent')
const PushManager = require('./PushManager')
const NavigationPreloadManager = require('./NavigationPreloadManager')
const ContentIndex = require('./ContentIndex')
const { mixin } = require('../engine/handler')

module.exports = class ServiceWorkerRegistration extends EventTarget {
  /**
   * Constructor
   * @param {String} scope
   */
  constructor(scope) {
    super()
    this._pushManager = new PushManager()
    this._scope = scope
    this._navigationPreload = new NavigationPreloadManager()
    this._index = new ContentIndex()

    // ServiceWorker instances stored here
    this._installing = null
    this._waiting = null
    this._active = null

    this._notifications = new Set()
    mixin(this)
  }

  get scope() {
    return this._scope
  }

  get installing() {
    return this._installing
  }

  get waiting() {
    return this._waiting
  }

  get active() {
    return this._active
  }

  get navigationPreload() {
    return this._navigationPreload
  }

  get pushManager() {
    return this._pushManager
  }

  get index() {
    return this._index
  }

  /**
   * Retrieve notifications
   * @param {Object} options
   *  - {String} tag
   * @returns {Promise<Array>}
   */
  async getNotifications(options) {
    if (options && options.tag && options.tag.length > 0) {
      const arr = Array.from(this._notifications)
      return arr.filter((v, i, a) => (v.tag ? v.tag === options.tag : false))
    }
    return Array.from(this._notifications)
  }

  /**
   * Create notification
   * @param {String} title
   * @param {Object} options
   * @returns {Promise<NotificationEvent>}
   */
  async showNotification(title, options) {
    const notification = new Notification(title, options)

    this._notifications.add(notification)

    notification.close = () => {
      this._notifications.delete(notification)
    }

    // return new NotificationEvent('notification', notification)
  }

  /**
   * Update worker script
   * @returns {void}
   */
  update() {
    // No-op
  }

  _destroy() {
    this._pushManager._destroy()
    this._pushManager = null
    this._notifications.clear()
    this._notifications = null
    this._navigationPreload = null
    this._index = null
  }
}
