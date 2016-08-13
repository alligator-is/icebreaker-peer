var _  = require('icebreaker')
var network = require('icebreaker-network')
var listen = network.listen
var combine = network.combine
var map = network.map
var utils = require('icebreaker-network/lib/util')
var Connector = require('./connector')
var url = require('url')

function defaultUrl(addr,params){
    var p = url.parse(addr)
    if(p.pathname==null)p.pathname='/'+params.appKey
        if(p.auth==null)p.auth = params.keys.publicKey.toString('base64')
    return url.format(p)
}

var Peer = module.exports = function Peer(params){
    var connector = Connector(params)
    var listeners = [connector]
    var ready
    var end
    var combined
    var lastId = 0
    var connections = {}
    var onEnd = require('./onEnd')({ lastId: lastId, connections: connections })
    var timer = null
    
    function source(){
      if(!ready){
        var combined =  combine.apply(null,listeners)
        end =combined.end
    
        ready = _(
          combined,
          map({
            ready:function(e){
              e.address=e.address.filter(function(i){
                return i!=null
              })
              return e
            },
            connection: function (e) {
                var peerID = null
                if (e.address != null) {
                    try {
                        peerID = utils.parseUrl(e.address).auth
                    }
                    catch (err) {

                    }
                }
                if (e.remote) peerID = e.remote.toString('base64')
                delete e.remote
                if (peerID != null) e.peerID = peerID
                return onEnd(e)
            }
        })
      )
    }

    ready.apply(null, [].slice.call(arguments))
  }

  source.connect = function(addr,_params){
      connector.connect(defaultUrl(addr),params)
  }

  source.listen = function(addr,_params){
    listeners.push(
      listen(
        defaultUrl(addr,params),
        utils.defaults({
            keys:params.keys,
            appKey:params.appKey,
            authenticate:params.
            authenticate
        },_params||{})
      )
    )
  }

  source.on = network.on
  source.map = network.map
  source.asyncMap = network.asyncMap
  source.end = function close() {
    if (end==null) return
    if (timer == null) {
      timer = setTimeout(function close() {
        for (var i in connections) {
          var c = connections[i]
          if (typeof c === 'function') {
              c()
              connections[i]=true
          }
        }

        if (end!=null && Object.keys(connections).length === 0) {
          timer = null
          if (end) end() 
          end=null
          return
        }
      
        setTimeout(close, 1000)
      }, 1000)
    }
  }

  return source
}