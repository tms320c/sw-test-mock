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
            const str = new sw.scope.URLSearchParams(query)
          }).to.not.throw()

          // TextEncoder and TextDecoder
          expect(() => {
            const encoder = new sw.scope.TextEncoder()
            const decoder = new sw.scope.TextDecoder()
          }).to.not.throw()

          // Blob
          expect(() => {
            const bbb = new sw.scope.Blob([])
          }).to.not.throw()

          // EventTarget
          expect(() => {
            const target = new EventTarget()
          }).to.not.throw()

          // Event
          expect(() => {
            const target = new Event('test')
          }).to.not.throw()
        })
    })
  })
})
