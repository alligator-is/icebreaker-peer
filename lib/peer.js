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
  if (p.pathname == null) p.pathname = '/' + params.appKey
  if (p.auth == null) p.auth = params.keys.publicKey.toString('base64')
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

  function source() {
    if (ready == null) {
      combined = combine.apply(null, listeners)

      while (queue.length > 0) combined.push.apply(null, [].slice.call(queue.shift()));
      end = combined.end
      ready = require('pull-pushable')(function () {
      })

      var push = ready.push

      _(
        combined,
        map({
          ready: function (e) {
            e.address = e.address.filter(function (i) {
              return i != null
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
            return onEnd(e, function () {
              push(utils.defaults({ type: 'disconnection' }, e))
            })
          }
        }),
        _.drain(ready.push, ready.end)
      )
    }

    ready.apply(null, [].slice.call(arguments))
  }

  source.connect = function (addr, _params, cb) {
    connector.connect(defaultUrl(addr), params, cb)
  }
  
  source.push = function () {
    if (combined == null) {
      queue.push(arguments)
      return
    }

    combined.push.apply(null, [].slice.call(arguments))
  }

  source.listen = function (addr, _params) {
    listeners.push(
      listen(
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
  source.asyncMap = network.asyncMap
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