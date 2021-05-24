'use strict'

const nodeFetch = require('node-fetch')

const RE_ABSOLUTE = /^https?/

/**
 * Fetch function factory
 * @param {String} origin
 * @returns {Function}
 */
const fetchFactory =
  (origin = '') =>
  (url, options) => {
    const request = typeof url !== 'string' ? url : null

    if (request) {
      url = request.url
    }
    if (!RE_ABSOLUTE.test(url)) {
      url = resolve(origin, url)
    }
    if (request) {
      const { body = {}, headers = {}, method = 'GET', redirect = 'follow' } = request

      url = new nodeFetch.Request(url, { body, headers, method, redirect })
    }
    return nodeFetch(url, options)
  }

// @see https://nodejs.org/api/url.html#url_url_resolve_from_to
const resolve = (from, to) => {
  const resolvedUrl = new URL(to, new URL(from, 'resolve://'))
  if (resolvedUrl.protocol === 'resolve:') {
    // `from` is a relative URL.
    const { pathname, search, hash } = resolvedUrl
    return pathname + search + hash
  }
  return resolvedUrl.toString()
}

module.exports = {
  fetchFactory,
  resolve,
}
