const _pool = new Set()
// static _pool = new Map()
const _cache = new Map()
const _contexts = new Map()

const addContainer = (container) => {
  _pool.add(container)
  _cache.clear()
}

const getAllContexts = () => {
  return _contexts.values()
}

const hasContext = (urlScope) => {
  return _contexts.has(urlScope)
}

const addContext = (urlScope, ctx) => {
  _contexts.set(urlScope, ctx)
}

const getContext = (urlScope) => {
  return _contexts.get(urlScope)
}

const removeContext = (urlScope) => {
  _contexts.delete(urlScope)
}

const getForScope = (urlScope) => {
  const val = [..._pool.values()]
  return val.filter((v, i, a) => v._url.indexOf(urlScope) === 0)
  // return _getForPredicate(urlScope, (v, i, a) => v._url.indexOf(urlScope) === 0)
}

const getForWorker = (sw) => {
  return _getForPredicate(sw, (v, i, a) => v._sw === sw)
}

const _getForPredicate = (key, predicate) => {
  if (!_cache.has(key)) {
    const containers = [..._pool.values()].filter((v, i, a) => predicate(v, i, a))
    _cache.set(key, containers)
    return containers
  }
  return _cache.get(key)
}

const destroyAllContainers = () => {
  for (let container of _pool.values()) {
    container._destroy()
  }
  _pool.clear()

  for (const context of _contexts.values()) {
    context.registration._destroy()
    context.sw._destroy()
    context.scope._destroy()
  }
  _contexts.clear()
}

module.exports = {
  addContainer,
  getAllContexts,
  hasContext,
  addContext,
  getContext,
  removeContext,
  getForWorker,
  getForScope,
  destroyAllContainers,
}
