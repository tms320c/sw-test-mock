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

module.exports = {
  getUnregister,
}
