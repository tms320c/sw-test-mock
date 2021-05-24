'use strict'
const atob = require('atob')

module.exports = class PushSubscription {
  /**
   * Constructor
   * @param {Object} options
   */
  constructor(options) {
    this.endpoint = 'test'
    this.options = options
    this.expirationTime = null
    this._keys = {
      p256dh: urlBase64ToUint8Array(base64encode(p256)),
      auth: urlBase64ToUint8Array(base64encode(auth)),
      applicationServerKey: urlBase64ToUint8Array(base64encode(options.applicationServerKey ?? '')),
    }
  }

  /**
   * Retrieve public key
   * @returns {ArrayBuffer}
   */
  getKey(name) {
    return this._keys[name]
  }

  /**
   * Serialize
   * @returns {Object}
   */
  toJSON() {
    return {
      endpoint: this.endpoint,
      options: this.options,
      expirationTime: this.expirationTime,
    }
  }

  /**
   * Unregister subscription
   * @returns {Promise<Boolean>}
   */
  async unsubscribe() {
    // TODO: remove from PushManager
    this._keys = {
      p256dh: null,
      auth: null,
      applicationServerKey: null,
    }
    return true
  }
}

const p256 =
  'BFxgAMY0MRglREaqjg_yzN0xfSrmQ2bkBp_TMlDeDBgku2hYbdkgTNs13sjDYFa-EBA_Vt2EXeUyVgncQQJgYHs'
const auth = 'AW4KIpwPHs2MvJW-j2LFwg'

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

const base64encode = (str, encoder = new TextEncoder()) => bytesToBase64(encoder.encode(str))
/**
 *
 * @param bytes {Uint8Array}
 * @returns {string}
 */
const bytesToBase64 = (bytes) => {
  let result = '',
    i,
    l = bytes.length
  for (i = 2; i < l; i += 3) {
    result += base64abc[bytes[i - 2] >> 2]
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)]
    result += base64abc[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)]
    result += base64abc[bytes[i] & 0x3f]
  }
  if (i === l + 1) {
    // 1 octet yet to write
    result += base64abc[bytes[i - 2] >> 2]
    result += base64abc[(bytes[i - 2] & 0x03) << 4]
    result += '=='
  }
  if (i === l) {
    // 2 octets yet to write
    result += base64abc[bytes[i - 2] >> 2]
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)]
    result += base64abc[(bytes[i - 1] & 0x0f) << 2]
    result += '='
  }
  return result
}

const base64abc = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '+',
  '/',
]
