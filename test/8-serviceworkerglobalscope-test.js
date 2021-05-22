'use strict'

const { expect } = require('chai')
const { connect, destroy } = require('../index')
const nock = require('nock')

let fake, sw

describe('ServiceWorkerGlobalScope', () => {
  beforeEach((done) => {
    connect('http://localhost:3333').then((serviceWorker) => {
      sw = serviceWorker
      done()
    })
  })
  afterEach(() => {
    destroy()
  })

  describe('Properties', () => {
    it('should have specified properties', () => {
      return sw
        .register('test/fixtures/sw.js')
        .then((registration) => sw.ready)
        .then((registration) => {
          expect(sw._sw.state).to.equal('activated')

          // caches
          expect(() => {
            const caches = sw.scope.caches
          }).to.not.throw()
          expect(sw.scope.caches).to.is.an('object')

          // clients
          expect(() => {
            const caches = sw.scope.clients
          }).to.not.throw()
          expect(sw.scope.clients).to.is.an('object')

          // crossOriginIsolated
          expect(() => {
            const isolated = sw.scope.crossOriginIsolated
          }).to.not.throw()
          expect(sw.scope.crossOriginIsolated).to.is.a('boolean')

          // indexedDB
          expect(() => {
            const IDBFactory = sw.scope.indexedDB
          }).to.not.throw()
          expect(sw.scope.indexedDB).to.is.an('object')

          // isSecureContext
          expect(() => {
            const isItSecure = sw.scope.isSecureContext
          }).to.not.throw()
          expect(sw.scope.isSecureContext).to.is.a('boolean')

          // origin
          expect(() => {
            const myOrigin = sw.scope.origin
          }).to.not.throw()
          expect(sw.scope.origin).to.is.a('string')

          // registration
          expect(() => {
            const myRegistration = sw.scope.registration
          }).to.not.throw()
          expect(sw.scope.registration).to.is.an('object')
        })
    })
  })

  describe('Methods', () => {
    it('should have specified methods', () => {
      return sw
        .register('test/fixtures/sw.js')
        .then((registration) => sw.ready)
        .then((registration) => {
          expect(sw._sw.state).to.equal('activated')

          // atob and btoa
          expect(sw.scope.atob).to.be.a('function')
          expect(sw.scope.btoa).to.be.a('function')

          // setInterval, clearInterval, setTimeout
          expect(sw.scope.setInterval).to.be.a('function')
          expect(sw.scope.clearInterval).to.be.a('function')
          expect(sw.scope.setTimeout).to.be.a('function')

          // fetch
          expect(sw.scope.fetch).to.be.a('function')

          // skipWaiting
          expect(sw.scope.skipWaiting).to.be.a('function')

          // queueMicrotask
          expect(sw.scope.queueMicrotask).to.be.a('function')

          // createImageBitmap
          expect(sw.scope.createImageBitmap).to.be.a('function')
        })
    })
  })
})
