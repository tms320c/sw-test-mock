'use strict'

const PushSubscription = require('./PushSubscription')

module.exports = class PushManager {
  constructor() {
    this.supportedContentEncodings = ['aes128gcm']
    this.subscription = new PushSubscription({
      userVisibleOnly: true,
      applicationServerKey: publicVAPID,
    })
  }

  /**
   * Retrieve subscription
   * @returns {Promise<PushSubscription>}
   */
  async getSubscription() {
    return this.subscription
  }

  /**
   * Retrieve permission state
   * @returns {Promise<String>}
   */
  async permissionState(options = { userVisibleOnly: true, applicationServerKey: '' }) {
    return 'granted'
  }

  /**
   * Retrieve subscription
   * @returns {Promise<PushSubscription>}
   */
  async subscribe(options = { userVisibleOnly: true, applicationServerKey: '' }) {
    return this.subscription
  }

  _destroy() {
    this.subscription = null
  }
}

const publicVAPID =
  'BEO9dcr9SQjhCnP-umx7SSY7NJ7HotOOSb2IFVAasW7Dv2E08bZwps9McJkBb8VVbchMuEaFOahuL4Bvfqw7c5E'
