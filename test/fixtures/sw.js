'use strict'

self.addEventListener('install', (evt) => {
  // const ev = new FetchEvent('test', null)
  self.foo = 'foo'
})

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    new Promise((resolve) => {
      self.bar = 'bar'
      setTimeout(resolve, 100)
    })
  )
})
