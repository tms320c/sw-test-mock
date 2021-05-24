'use strict'

const { expect } = require('chai')
const { connect, destroy } = require('../index')
const nock = require('nock')

let fake, sw

describe('sw-test-mock-special', () => {
  before(() => {
    nock.disableNetConnect()
    nock.enableNetConnect('localhost')
  })
  beforeEach((done) => {
    fake = nock('http://localhost:3333', { encodedQueryParams: true })
    connect('http://localhost:3333').then((serviceWorker) => {
      sw = serviceWorker
      console.log('ID before', sw.id)
      done()
    })
  })
  afterEach(() => {
    nock.cleanAll()
    destroy()
  })
  after(() => {
    nock.enableNetConnect()
  })
  describe('ready', () => {
    it('should execute install/activate lifecyle for multiple connected pages', () => {
      return connect().then((sw2) => {
        console.log('ID in test', sw.id, sw2.id)
        return sw
          .register('test/fixtures/sw.js')
          .then((registration) => {
            console.log('ID after reg', sw.id)
            return sw.ready
          })
          .then((registration) => {
            console.log('ID in expect', sw.id, sw2.id)
            expect(sw._sw.state).to.equal('activated')
            expect(sw2._sw.state).to.equal('activated')
            expect(sw.scope.foo).to.equal('foo')
            expect(sw2.scope.bar).to.equal('bar')
            expect(sw.scope.clients._clients.length).to.equal(2)
          })
      })
    })
  })
})
