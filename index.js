var uuid = require('node-uuid')
var EventEmitter = require('events').EventEmitter
var _ = require('icebreaker')
var ip = require('ip')

function isFunction(obj) {
  return typeof obj === 'function'
}

_.mixin({
  peer: function (params) {
    return function (options) {
      var emitter = new EventEmitter()

      emitter.connections = {}

      function check(listener){
        if (this.listeners(listener).length === 0) {
          throw new Error('no peer '+listener+' listener defined')
        }
      }

      function apply(options) {
        if (typeof options === 'object') {
          for (var k in options) {
            var value = options[k]
            if (!isFunction(value)) emitter[k] = value
          }
        }
      }

      emitter.start = function (options) {
        apply(options)
        if (!this.address) this.address = ip.address()
        check.call(this,'start')
        this.emit('start')
      }

      emitter.stop = function () {
        check.call(this,'stop')
        this.emit('stop')
      }

      emitter.connect = function (options) {
        check.call(this,'connect')
        if (typeof options !== 'object') options = {}
        options.direction=1
        this.emit('connect', options)
      }

      emitter.connection = function (params) {
        if (!params.type) params.type = this.name
        if (!params.id) params.id = uuid.v4()
        if (!params.address) params.address = this.address || ip.address()
        if (!params.port) params.port = this.port
        if (!params.direction)params.direction=-1

        var source = params.source, sink = params.sink
        var ended=false,_ended=false

        var del = function(){
          if(ended===true && _ended === true){
            delete emitter.connections[params.id]
            del=null
            params=null
          }
        }

        params.source = function(end,cb){
         source(end,function(end,data){
          if(end)ended=true
          cb(end,data)
          if(end&&del)del()
          })
        }

        params.sink = function(read){
         sink(function(abort,cb){
           if(abort) {
             _ended=true
              if(del)del()
              return read(abort,cb)
           }
           read(abort,function(end,data){
            cb(end,data)
            if(end)_ended=true
            if(end&&del)del()
          })
         })
        }

        emitter.connections[params.id] = params
        this.emit('connection', params)
      }

      apply(params)
      apply(options)

      for (var key in params) {
        var value = params[key]
        if (!isFunction(value)) this[key] = params[key]
      }

      var handle = function (key) {
        if (isFunction(params[key])) {
          var event = function () {
            params[key].apply(this, [].slice.call(arguments))
          }.bind(this)
          this.on(key, event)
        }
      }.bind(emitter)

      handle('start')
      handle('stop')
      handle('connect')

      return emitter
    }
  }
})
