var _ = require('icebreaker')
var network = require('icebreaker-network')
var listen = network.listen
var combine = network.combine
var map = network.map
var utils = require('icebreaker-network/lib/util')
var Connector = require('./connector')
var url = require('url')

function defaultUrl(addr, params) {
  var p = url.parse(addr)
  if ((p.pathname == null || p.pathname.length ===1) && params.appKey!=null) p.pathname = '/' + params.appKey
  params.encoding = params.encoding||'base64'
  var auth
  if (p.auth == null && params.keys.publicKey!=null) auth = utils.encode(params.keys.publicKey,params.encoding)
  else if (p.auth == null && params.keys.id!=null) auth = utils.encode(params.keys.id,params.encoding)
  if(auth)return p.format().replace(p.protocol+"//",p.protocol+"//"+encodeURIComponent(auth)+"@");
 
  return url.format(p)
}

var Peer = module.exports = function Peer(params) {
  var connector = Connector(params)
  var listeners = [connector]
  var ready
  var end
  var combined
  var lastId = 0
  var connections = {}
  var onEnd = require('./onEnd')({ lastId: lastId, connections: connections })
  var closed = false
  var queue = []
  
  var m =map({
    ready: function (e) {
      if(e.address==null)return e
      e.address = e.address.filter(function (i) {
        return i != null
      })
      return e
    },
    connection: function (e) {
      var peerID = null
      if (e.address != null) {
        try {
          peerID = utils.parseUrl(e.address).auth||null
        }
        catch (err) {

        }
      }
      if (e.remote) peerID = utils.encode(new Buffer(e.remote,'base64'),params.encoding||'base64')
      delete e.remote
      if (peerID != null) e.peerID = peerID
     return e
    }
  })

  function source() {
    if (ready == null) {
      combined = combine.apply(null, listeners)
      end = combined.end
      ready = _.pushable(function () {
      })
   
      var push = ready.push
      _(
        combined,
        m,
        map({
          ready:function(e){
            while (queue.length > 0) combined.push.apply(null, queue.shift());
            return e
          },
        connection:function(e){
        var s  =  onEnd(e, function () {
          push(utils.defaults({ type: 'disconnection' }, e))
        })
        if(e.callback){
          var c = e.callback
          delete e.callback;
          c(null,s)
        }
        return s
        }
      }),
        _.drain(ready.push, ready.end)
      )
    }

    ready.apply(null, [].slice.call(arguments))
  }

  source.connect = function (addr, _params, cb) {
    connector.connect(defaultUrl(addr,params),utils.defaults(params, _params || {}), cb)
  }
  
  source.push = function () {
    if (combined == null) {
      queue.push([].slice.call(arguments))
      return
    }
    
    combined.push.apply(null, [].slice.call(arguments))
  }

  source.listen = function (addr, _params) {
    listeners.push(listen(
        defaultUrl(addr, params),
        utils.defaults({
          keys: params.keys,
          appKey: params.appKey,
          authenticate: params.
            authenticate
        }, _params || {})
      )
    )
  }

  source.on = network.on
  source.map = network.map
  source.combine = network.combine
  source.asyncMap = network.asyncMap
  source.protoNames = network.protoNames
  source.end = function () {
    if (end == null) return
    if (closed == false) {
      closed = true
      setTimeout(function close() {
        if (end == null) return

        for (var i in connections) {
          var c = connections[i]
          if (typeof c === 'function') {
            c()
            delete c
          }
        }

        if (end != null && Object.keys(connections).length === 0) {
          if (end) end()
          end = null
          return
        }

        setTimeout(close, 1000)
      }, 1000)
    }
  }

  return source
}
