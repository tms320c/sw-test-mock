'use strict'

/* // All ServiceWorker properties:
const swProps = 'Object,Function,Array,Number,parseFloat,parseInt,Infinity,NaN,undefined,Boolean,String,Symbol,Date,Promise,RegExp,Error,EvalError,RangeError,ReferenceError,SyntaxError,TypeError,URIError,JSON,Math,console,Intl,ArrayBuffer,Uint8Array,Int8Array,Uint16Array,Int16Array,Uint32Array,Int32Array,Float32Array,Float64Array,Uint8ClampedArray,DataView,Map,Set,WeakMap,WeakSet,Proxy,Reflect,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,escape,unescape,eval,isFinite,isNaN,ByteLengthQueuingStrategy,CountQueuingStrategy,ReadableStream,WritableStream,NavigationPreloadManager,PushSubscriptionOptions,PushSubscription,PushManager,PushEvent,PermissionStatus,Permissions,PerformanceObserverEntryList,NotificationEvent,Notification,DOMRectReadOnly,DOMRect,DOMQuad,DOMPointReadOnly,DOMPoint,DOMMatrixReadOnly,DOMMatrix,StorageManager,BudgetService,BroadcastChannel,SyncManager,SyncEvent,WindowClient,WebSocket,TextEncoder,TextDecoder,SubtleCrypto,ServiceWorkerRegistration,ServiceWorkerGlobalScope,Response,Request,PushMessageData,InstallEvent,IDBVersionChangeEvent,IDBTransaction,IDBRequest,IDBOpenDBRequest,IDBObjectStore,IDBKeyRange,IDBIndex,IDBFactory,IDBDatabase,IDBCursorWithValue,IDBCursor,Headers,FetchEvent,ExtendableMessageEvent,ExtendableEvent,EventSource,CryptoKey,Crypto,CloseEvent,Clients,Client,CacheStorage,Cache,WorkerNavigator,WorkerLocation,WorkerGlobalScope,URLSearchParams,URL,PromiseRejectionEvent,MessagePort,MessageEvent,MessageChannel,ImageData,ImageBitmap,FormData,FileReader,FileList,File,EventTarget,Event,DOMStringList,DOMException,CustomEvent,Blob,clients,registration,onactivate,onfetch,oninstall,onmessage,fetch,skipWaiting,onsync,onnotificationclick,onnotificationclose,onpush,SharedArrayBuffer,Atomics,WebAssembly,getAllPropertyNames,constructor,self,location,onerror,navigator,onrejectionhandled,onunhandledrejection,isSecureContext,origin,performance,importScripts,btoa,atob,setTimeout,clearTimeout,setInterval,clearInterval,createImageBitmap,crypto,indexedDB,fetch,caches,constructor,addEventListener,removeEventListener,dispatchEvent,constructor,constructor,__defineGetter__,__defineSetter__,hasOwnProperty,__lookupGetter__,__lookupSetter__,isPrototypeOf,propertyIsEnumerable,toString,valueOf,__proto__,toLocaleString'
*/

/* // Missing Context properties:
'BroadcastChannel,BudgetService,ByteLengthQueuingStrategy,CloseEvent,CountQueuingStrategy,Crypto,CryptoKey,CustomEvent,DOMException,DOMMatrix,DOMMatrixReadOnly,DOMPoint,DOMPointReadOnly,DOMQuad,DOMRect,DOMRectReadOnly,DOMStringList,EventSource,ExtendableMessageEvent,File,FileList,FileReader,ImageBitmap,ImageData,InstallEvent,NavigationPreloadManager,PerformanceObserverEntryList,PermissionStatus,Permissions,PromiseRejectionEvent,PushMessageData,PushSubscriptionOptions,ReadableStream,SharedArrayBuffer,StorageManager,SubtleCrypto,SyncEvent,SyncManager,WebSocket,WindowClient,WorkerGlobalScope,WorkerLocation,WorkerNavigator,WritableStream,crypto,dispatchEvent,onactivate,onerror,onfetch,oninstall,onmessage,onnotificationclick,onnotificationclose,onpush,onrejectionhandled,onsync,onunhandledrejection,removeEventListener'
*/

function getAllPropertyNames(obj) {
  let props = []
  do {
    props = props.concat(Object.getOwnPropertyNames(obj))
  } while ((obj = Object.getPrototypeOf(obj)))
  return props
}

const fs = require('fs')
const path = require('path')
const atob = require('atob')
const btoa = require('btoa')
const Blob = require('cross-blob')
const Cache = require('./Cache')
const CacheStorage = require('./CacheStorage')
const Client = require('./Client')
const Clients = require('./Clients')
const ExtendableEvent = require('./events/ExtendableEvent')
const FetchEvent = require('./events/FetchEvent')
const fakeIndexedDB = require('fake-indexeddb/build/fakeIndexedDB')
const FDBCursor = require('fake-indexeddb/build/FDBCursor')
const FDBCursorWithValue = require('fake-indexeddb/build/FDBCursorWithValue')
const FDBDatabase = require('fake-indexeddb/build/FDBDatabase')
const FDBFactory = require('fake-indexeddb/build/FDBFactory')
const FDBIndex = require('fake-indexeddb/build/FDBIndex')
const FDBKeyRange = require('fake-indexeddb/build/FDBKeyRange')
const FDBObjectStore = require('fake-indexeddb/build/FDBObjectStore')
const FDBOpenDBRequest = require('fake-indexeddb/build/FDBOpenDBRequest')
const FDBRequest = require('fake-indexeddb/build/FDBRequest')
const FDBTransaction = require('fake-indexeddb/build/FDBTransaction')
const FDBVersionChangeEvent = require('fake-indexeddb/build/FDBVersionChangeEvent')
const FormData = require('form-data')
const Headers = require('./Headers')
const importScripts = require('./importScripts')
const Notification = require('./Notification')
const NotificationEvent = require('./events/NotificationEvent')
const PushEvent = require('./events/PushEvent')
const PushManager = require('./PushManager')
const PushSubscription = require('./PushSubscription')
const Request = require('./Request')
const Response = require('./Response')
const ServiceWorkerGlobalScope = require('./ServiceWorkerGlobalScope')
const ServiceWorkerRegistration = require('./ServiceWorkerRegistration')

const nativeRequire = require

/**
 * Create context object for 'globalScope'
 * @param {Object} globalScope
 * @param {Object} contextlocation
 * @param {String} contextpath
 * @param {String} origin
 * @param {Function} fetch
 * @param {Function} permissionsQuery
 * @returns {Object}
 */
module.exports = function createContext(
  globalScope,
  contextlocation,
  contextpath,
  origin,
  fetch,
  permissionsQuery
) {
  const scriptModule = { exports: {} }
  let glob = Object.assign(globalScope, {
    atob,
    btoa,
    Blob,
    Cache,
    CacheStorage,
    Client,
    Clients,
    crossOriginIsolated: false, // This value is dependant on any Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers
    ExtendableEvent,
    FetchEvent,
    FormData,
    Headers,
    importScripts,
    IDBCursor: FDBCursor.default,
    IDBCursorWithValue: FDBCursorWithValue.default,
    IDBDatabase: FDBDatabase.default,
    IDBFactory: FDBFactory.default,
    IDBIndex: FDBIndex.default,
    IDBKeyRange: FDBKeyRange.default,
    IDBObjectStore: FDBObjectStore.default,
    IDBOpenDBRequest: FDBOpenDBRequest.default,
    IDBRequest: FDBRequest.default,
    IDBTransaction: FDBTransaction.default,
    IDBVersionChangeEvent: FDBVersionChangeEvent.default,
    navigator: {
      connection: 'not implemented',
      storage: 'not implemented',
      locks: 'not implemented',
      serial: 'not implemented',
      online: true,
      language: 'en-US',
      languages: ['en-US'],
      permissions: {
        query: permissionsQuery,
        request: () => undefined,
        requestAll: () => undefined,
      },
      userAgent: 'sw-test-mock',
    },
    Notification,
    NotificationEvent,
    PushEvent,
    PushManager,
    PushSubscription,
    performance: 'not implemented',
    Request,
    Response,
    ServiceWorkerGlobalScope,
    ServiceWorkerRegistration,
    exports: scriptModule.exports,
    fetch,
    indexedDB: fakeIndexedDB.default,
    location: contextlocation,
    module: scriptModule,
    origin,
    self: globalScope,
    require: getRequire(contextpath),
  })

  const gp = getAllPropertyNames(global)
  for (let i = 0; i < gp.length; i++) {
    if (gp[i] !== '__proto__' && gp[i] !== 'performance') {
      glob[gp[i]] = global[gp[i]]
    }
  }

  glob.isSecureContext =
    origin.includes('localhost') || origin.includes('//127.0.0.1') || origin.includes('https://')

  glob.createImageBitmap = async function (data) {
    return new Promise((resolve, reject) => {
      if (data instanceof Blob) {
        return URL.createObjectURL(data)
      } else {
        throw new Error('createImageBitmap does not handle the provided image source type')
      }
    })
  }

  return glob
}

/**
 * Retrieve 'require' function for 'contextPath'
 * @param {String} contextPath
 * @returns {Function}
 */
function getRequire(contextPath) {
  const r = function require(requiredPath) {
    return nativeRequire(getResolvedPath(contextPath, requiredPath))
  }

  r.resolve = function resolve(requiredPath) {
    return nativeRequire.resolve(getResolvedPath(contextPath, requiredPath))
  }

  return r
}

/**
 * Retrieve the fully resolved path
 * @param {String} contextPath
 * @param {String} p
 * @returns {String}
 */
function getResolvedPath(contextPath, p) {
  try {
    if (fs.statSync(contextPath).isFile()) {
      contextPath = path.dirname(contextPath)
    }
  } catch (err) {
    /* swallow */
  }

  return isRelativePath(p) ? path.resolve(contextPath, p) : p
}

/**
 * Determine if 'p' is relative path
 * @param {String} p
 * @returns {Boolean}
 */
function isRelativePath(p) {
  return p.indexOf('.') === 0
}
