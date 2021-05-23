'use strict'

module.exports = class MessageEvent extends Event {
  /**
   * Constructor
   * @param type
   * @param init
   */
  constructor(
    type,
    init = {
      data: null,
      ports: [],
      source: null,
      origin: '',
      lastEventId: '',
    }
  ) {
    super('message')
    this.data = init.data
    this.ports = init.ports
    this.source = init.source
  }
}
