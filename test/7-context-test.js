'use strict'

const { expect } = require('chai')
const { connect, destroy } = require('../index')
const nock = require('nock')

let fake, sw

describe('Context', () => {
  beforeEach((done) => {
    connect('http://localhost:3333').then((serviceWorker) => {
      sw = serviceWorker
      done()
    })
  })
  afterEach(() => {
    destroy()
  })

  describe('FormData and test/fixtures/sw.js', () => {
    it('exists in the context', () => {
      return sw
        .register('self.foo = new FormData()\n')
        .then((registration) => sw.ready)
        .then((registration) => {
          expect(sw._sw.state).to.equal('activated')
          expect(sw.scope.foo).to.not.be.null
        })
    })
    it('should have some stuff in the context', () => {
      return sw
        .register('test/fixtures/sw.js')
        .then((registration) => sw.ready)
        .then((registration) => {
          expect(sw._sw.state).to.equal('activated')

          // URLSearchParams
          expect(() => {
            const query = { key1: 'val1', key2: 'val2' }
            const str = new URLSearchParams(query)
          }).to.not.throw()

          // atob and btoa
          expect(sw.scope.atob).to.be.a('function')
          expect(sw.scope.btoa).to.be.a('function')

          // TextEncoder and TextDecoder
          expect(() => {
            const encoder = new sw.scope.TextEncoder()
            const decoder = new sw.scope.TextDecoder()
          }).to.not.throw()
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
})
