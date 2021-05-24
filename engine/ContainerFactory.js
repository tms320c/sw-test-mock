const { hasContainer, getContainer, addContainer, destroyAllContainers } = require('./pool')
const { getRegister } = require('./registration')
const { getTrigger } = require('./trigger')

const ServiceWorkerContainer = require('../lib/ServiceWorkerContainer')

module.exports = class ContainerFactory {
  /**
   *
   * @param {String} url
   * @param {String} webroot
   * @returns {ServiceWorkerContainer|any}
   */
  static get(url, webroot) {
    const key = `${url}${webroot}`
    if (hasContainer(key)) {
      return getContainer(key)
    }
    const container = new ServiceWorkerContainer(url, webroot)
    container.register = getRegister(container)
    container.trigger = getTrigger(container)

    addContainer(key, container)
    return container
  }

  static destroyAll() {
    destroyAllContainers()
  }
}
