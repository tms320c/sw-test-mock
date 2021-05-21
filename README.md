[![NPM Version](https://img.shields.io/npm/v/sw-test-env.svg?style=flat)](https://npmjs.org/package/sw-test-env)
[![Build Status](https://img.shields.io/travis/popeindustries/sw-test-env.svg?style=flat)](https://travis-ci.org/popeindustries/sw-test-env)

# ServiceWorker Test Environment

A sandboxed `ServiceWorker` context for testing your `ServiceWorker` code on the command line.

Testing code written to run in a `ServiceWorker` is hard, and generally requires a browser environment and lots of ceremony to work. `sw-test-env` is the magic ingredient for easy unit/integration testing of `ServiceWorker` code. Just load your script, and poke, prod, inspect, and manipulate the `ServiceWorker` context:

```js
const assert = require('assert');
const connect = require('sw-test-env').connect;
// Equivalent to opening a browser window and accessing window.navigator.serviceWorker
const sw = connect('http://localhost:3000', 'path/to/webroot');

// Load and execute sw.js in a sandboxed ServiceWorker context
sw.register('sw.js')
  // Trigger the 'install' event and inspect the cache contents
  .then((registration) => sw.trigger('install'))
  // Inspect the cache
  .then(() => sw.scope.caches.open('v1'))
  .then((cache) => cache.keys())
  .then((requests) => {
    const urls = requests.map((request) => request.url);
    assert.ok(urls.includes('assets/index.js'));
  });
```

## Features

- load and execute `ServiceWorker` script files (or strings of code) in a sandboxed context
- load and execute Node.js-style modules without compile/bundle step
- inspect the properties of the `ServiceWorker` scope (`clients`, `caches`, `registration`, etc)
- inspect/trigger exported `module` apis
- manually trigger events on `ServiceWorker` (`install`, `activate`, `fetch`, `error`, etc)
- connect multiple clients
- register multiple, scoped `ServiceWorker` instances
- `postMessage` between clients and registered `ServiceWorker` instances
- register for notifications and push messages to connected clients
- `importScripts()`
- use `indexedDB`

## Caveats

- limited `Response` streaming and body conversion (uses the primitives from [node-fetch](https://github.com/bitinn/node-fetch))
- `fetch` calls will be executed, so a request mocking tool like [nock](https://github.com/node-nock/nock) is recommended
- requires at least version 7 of Node
- not yet possible to cache based on `VARY` header
- not tested against spec test suite or specific browser behaviour

## API

#### **`connect(url: String, webroot: String): Promise<ServiceWorkerContainer>`**

Create a new `ServiceWorkerContainer` instance at `url` (default is `http://localhost:3333/`) with `webroot` (default is current working directory). This is equivalent to opening a browser at `url` and accessing the `window.navigator.serviceworker` object. See [ServiceWorkerContainer](#serviceworkercontainer) below for additional behaviour.

Multiple connections to same/different origins are supported, with access to `ServiceWorker` instances determined by `scope`.

**Note**: the `webroot` argument is used to resolve the path for registering the `ServiceWorker` and loading scripts with `importScripts()`.

#### **`destroy(): Promise`**

Destroy all active `ServiceWorkerContainer` instances and their registered `ServiceWorker` instances. Should generally be called after each test (for example, in `afterEach()` when using Mocha/Jest/etc).

#### **`Headers, MessageChannel, Request, Response`**

Classes for creating instances of `Headers`, `MessageChannel`, `Request`, and `Response` to be used when interacting with the `ServiceWorker` context.

### ServiceWorkerContainer

In addition to the behaviour documented [here](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer), a `ServiceWorkerContainer` instance returned by `connect()` has the following additions:

#### **`sw.register(scriptURL: String, options: Object): Promise<Registration>`**

Load and execute `scriptURL` in a mock `ServiceWorker` context. `scriptURL` may be a relative or absolute filepath, or a string of code to be parsed and executed.

In addition to all the normal global apis available to a `ServiceWorker`, the loaded script will also have access to `require`, `module`, `exports`, and `process`. As a result, script code that normally requires bundling for the browser (with Webpack, Browserify, et. al.) can be tested without a build step.

**`options`** include:

- **`scope: String`** the `ServiceWorker` registration scope (defaults to `./`). Multiple `ServiceWorker` instances can be registered on the same origin with different scopes.

#### **`sw.ready: Promise`**

Force registered script to `install` and `activate`:

```js
sw.register('sw.js')
  .then((registration) => sw.ready)
  .then(() => {
    assert.equal(sw.controller.state, 'activated');
  });
```

#### **`sw.trigger(eventType: String, ...args): Promise`**

Manually trigger an event (`install`, `activate`, `fetch`, `error`) in the `ServiceWorker` scope:

```js
sw.register('sw.js')
  .then((registration) => sw.ready)
  .then((registration) => sw.trigger('fetch', '/assets/index.js'))
  .then((response) => {
    assert.equal(response.url, 'http://localhost:3333/assets/index.js');
  });
```

#### **`sw.scope: ServiceWorkerGlobalScope`**

Access the scope in which the registered script is running in:

```js
sw.register('sw.js')
  .then((registration) => sw.ready)
  .then(() => sw.scope.caches.open('v1'))
  .then((cache) => cache.keys())
  .then((requests) => {
    const urls = requests.map((request) => request.url);
    assert.ok(urls.includes('assets/index.js'));
  });
```

#### **`sw.api: Object`**

If a registered script exposes a module api (via `module` and `exports`), you can access the result as `api`:

```js
sw.register('sw-utils.js')
  .then((registration) => sw.ready)
  .then((registration) => {
    sw.api.someUtilFn();
  });
```

## Inspiration & Thanks

Special thanks goes to Pope Industries ([sw-test-env](https://github.com/popeindustries/sw-test-env)) as to the author of the original work.
