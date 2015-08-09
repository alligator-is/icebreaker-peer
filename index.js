var uuid = require('node-uuid')
var EventEmitter = require('events').EventEmitter
var _ = require('icebreaker')
var ip = require('ip')
var net = require('net')

function isFunction(obj) {
  return typeof obj === 'function'
}

function apply(options, to) {
  if (typeof options === 'object') {
    for (var k in options) {
      var value = options[k]
      if (!isFunction(value)) to[k] = value
    }
  }
}

function check(emitter, listener) {
  if (emitter.listeners(listener).length === 0) {
    throw new Error('no peer ' + listener + ' listener defined')
  }
}


function Peer(params,ext) {
  if(!(this instanceof Peer)) return new Peer(params,ext)

  EventEmitter.call(this)

  if(ext)apply(ext,params)

  this.connections = {}
  this._seen = []
  this.state = 'stopped';

  apply(params, this)

  this.address = this.address||ip.address()

  this.port = this.port||6005

  if (isFunction(params.start)) {
    this.on('start', params.start)
  }

  if (isFunction(params.stop)) {
    this.on('stop', params.stop)
  }

  if (isFunction(params.connect)) this.on('connect', params.connect)
}

var proto = Peer.prototype = Object.create(EventEmitter.prototype)
proto.constructor = Peer

proto.start = function (options) {
  apply(options, this)
  check(this, 'start')
  this.emit('start')
}

proto.stop = function () {
  var self = this


  if(this.state === "stop" || this.state === "start") return

  if(this.state==='started')
  this.once('stopped',function(){
    if(this.state ==="stop") this.state==='stopped'
  })

  this.state='stop'

  check(this, 'stop')

  _(
    [this.connections],
    _.flatten(),
    _.filter(function (c) {
      return self._seen.indexOf(c.id) === -1 && isFunction(c.close)
    }),
    _.asyncMap(function (c, cb) {
      self._seen.push(c.id)
      c.close(function () {
        cb()
      })
    }),
    _.onEnd(function () {
      setTimeout(function () {
        if (self.connections && Object.keys(self.connections).length > 0)
          return self.stop()
        self._seen = []
        self.emit('stop')
      }, 50)
    })
  )
}

proto.connect = function (params) {
  if(this.state==="stop"||this.state === "stopped") return
  check(this, 'connect')
  if (typeof params !== 'object') params = {}
  params.direction = 1
  if (typeof params.address === 'string' && !net.isIP(params.address)) {
    params.hostname = params.address
  }
  if (!params.id)params.id = uuid.v4()

  this.emit('connect', params)
}

proto.connection = function (params) {
  var self = this
  if (!params.type) params.type = this.name
  if (!params.id)params.id = uuid.v4()
  if (!params.address) params.address = this.address || ip.address()
  if (!params.port) params.port = this.port
  if (!params.direction) params.direction = -1
  if(params.direction === -1)params.peer = self.peer

  var source = params.source, sink = params.sink
  var ended = false, _ended = false
  var del = function () {
    if (ended === true && _ended === true) {
      var connection = self.connections[params.id]
      delete self.connections[params.id]
      del = null
      params = null
      self.emit('disconnected', connection)
    }
  }

  params.source = function (end, cb) {
    source(end, function (end, data) {
      if (end) ended = true
      cb(end, data)
      if (end && del) del()
    })
  }

  params.sink = function (read) {
    sink(function (abort, cb) {
      if (abort) {
        _ended = true
        if (del) del()
        return read(abort, cb)
      }
      read(abort, function (end, data) {
        cb(end, data)
        if (end) _ended = true
        if (end && del) del()
      })
    })
  }

  this.emit('connection', this.connections[params.id] = params)
}

module.exports = Peer
