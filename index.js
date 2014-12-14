var uuid = require('node-uuid')
var EventEmitter = require('events').EventEmitter
var _ = require('icebreaker')
var ip = require('ip')

function isFunction(obj){
  return typeof obj ==='function'
}

_.mixin({
  peer:function(params){
    return function (options){
      var emitter = new EventEmitter()

      emitter.connections={}

      var apply = function(options){
        if(typeof options === 'object'){
          for(var k in options){
            var value = options[k]
            if(!isFunction(value))emitter[k]=value
          }
      }
      }

      emitter.start = function(options){
        apply(options)

        if(!this.address) this.address = ip.address()

        if(this.listeners('start').length===0){
          throw new Error('no peer start listener defined')
        }

        this.emit('start')
      }

      emitter.stop = function(){
        if(this.listeners('stop').length===0){
          throw new Error('no peer stop listener defined')
        }

        this.emit('stop')
      }

      emitter.connect = function(options){
        if(this.listeners('connect').length===0){
          throw new Error('no peer connect listener defined')
        }
        if(typeof options !=='object')options={}
        this.emit('connect',options)
      }

      emitter.connection = function(params){
        if(!params.type)params.type = this.name
        if(!params.id)params.id=uuid.v4()
        if(!params.address)params.address=this.address||ip.address()
        if(!params.port)params.port = this.port

        params.source=_(params.source,_.cleanup(function(err){
          delete emitter.connections[params.id]
        }))

        emitter.connections[params.id]=params
        this.emit('connection',params)
      }

      apply(params)
      apply(options)

      for(var key in params){
        var value = params[key]
        if(!isFunction(value))this[key]=params[key]
      }

      var handle = function(key){
        if(isFunction(params[key])){
          var event =function(){
            params[key].apply(this,[].slice.call(arguments))
          }.bind(this)
          this.on(key,event)
        }
      }.bind(emitter)

      handle('start')
      handle('stop')
      handle('connect')

      return emitter
    }
  }
})
