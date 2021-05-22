'use strict'

const { expect } = require('chai')
const { connect, destroy } = require('../index')
const nock = require('nock')

let fake, sw

describe('WorkerGlobalScope', () => {
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
    it('should have inherited properties', () => {
      return sw
        .register('test/fixtures/sw.js')
        .then((registration) => sw.ready)
        .then((registration) => {
          expect(sw._sw.state).to.equal('activated')

          // console
          expect(() => {
            const myConsole = sw.scope.console
          }).to.not.throw()
          expect(typeof sw.scope.console).to.equal('object')
          expect(sw.scope.console.log).to.is.a('function')

          // location
          expect(() => {
            const wLocation = sw.scope.location
          }).to.not.throw()
          // expect(sw.scope.location).to.is.an('object') // ??? throws exception, but typeof sw.scope.location returns 'object'
          expect(typeof sw.scope.location).to.equal('object')

          // self
          expect(sw.scope.self).to.is.an('object')

          // performance
          expect(typeof sw.scope.performance).to.equal('object') //.and.equal('not implemented')

          // navigator
          expect(() => {
            const myNav = sw.scope.navigator
          }).to.not.throw()
          expect(sw.scope.navigator).to.is.an('object')

          expect(sw.scope.navigator.connection).to.is.an('string').and.equal('not implemented')
          expect(sw.scope.navigator.locks).to.is.an('string').and.equal('not implemented')
          expect(sw.scope.navigator.serial).to.is.an('string').and.equal('not implemented')
          expect(sw.scope.navigator.storage).to.is.an('string').and.equal('not implemented')

          expect(sw.scope.navigator.userAgent).to.is.an('string')

          expect(sw.scope.navigator.permissions).to.is.an('object')
          expect(sw.scope.navigator.language).to.is.an('string')
          expect(sw.scope.navigator.languages).to.is.an('array')
        })
    })
    it('implements navigator.permissions with default query function', () => {
      return sw
        .register('test/fixtures/sw.js')
        .then((registration) => sw.ready)
        .then((registration) => {
          expect(sw._sw.state).to.equal('activated')

          expect(sw.scope.navigator.permissions)
            .to.be.an('object')
            .that.has.property('query')
            .that.is.a('function')
          expect(sw.scope.navigator.permissions.query.constructor.name).to.equal('AsyncFunction')

          sw.scope.navigator.permissions
            .query({
              name: 'notifications',
            })
            .then((status) => {
              expect(status).to.be.an('object').that.has.property('onchange').that.is.a('function')
              expect(status).to.be.an('object').that.has.property('state')
              expect(status.state).to.equal('granted')
            })

          sw.scope.navigator.permissions
            .query({
              name: 'something',
            })
            .then((status) => {
              expect(status).to.be.an('object').that.has.property('onchange').that.is.a('function')
              expect(status).to.be.an('object').that.has.property('state')
              expect(status.state).to.equal('denied')
            })

          sw.scope.navigator.permissions
            .query({
              name: 'notifications',
            })
            .then((status) => {
              expect(() => {
                status.state = 'it should be readonly'
              }).to.throw()
            })
        })
    })
  })

  describe('Methods', () => {
    it('should have inherited methods', () => {
      return sw
        .register('test/fixtures/sw.js')
        .then((registration) => sw.ready)
        .then((registration) => {
          expect(sw._sw.state).to.equal('activated')

          expect(sw.scope.importScripts).to.is.an('function')
        })
    })
  })
})
