const _ = require('icebreaker')
const network = require('icebreaker-network')
const listen = network.listen
const combine = network.combine
const map = network.map
const utils = require('icebreaker-network/lib/util')
const defaultUrl = require('./defaultUrl')

module.exports = function Server(params) {
  const connections = {}
  
  let listeners = []
  if(params.listeners){
    listeners=listeners.concat(params.listeners)
    delete params.listeners
  } 
  let ready
  let end
  let combined
  let lastId = 0
  const onEnd = require('./onEnd')({ lastId: lastId, connections: connections })
  let closed = false
  const queue = []

  const m =map({
    ready: function (e) {
      if(e.address==null)return e
      e.address = e.address.filter((i) => { return i != null })
      return e
    },
    connection: function (e) {
      let peerID = null
      if (e.address != null) {
        try {
          peerID = utils.parseUrl(e.address).auth||null
        }
        catch (err) {

        }
      }
      if (e.remote) peerID = utils.encode(new Buffer.from(e.remote,'base64'),params.encoding||'base64')
      delete e.remote
      if (peerID != null) e.peerID = peerID
     return e
    }
  })

  function source(...args) {
    if (ready == null) {
      combined = combine(...listeners)
      end = combined.end
      ready = _.pushable(() => { })
   
      const push = ready.push
      _(
        combined,
        m,
        map({
          ready:(e)=>{
            while (queue.length > 0) combined.push.apply(null, queue.shift());
            return e
          },
        connection:(e)=>{
          const s  =  onEnd(e, () => push(utils.defaults({ type: 'disconnection' }, e)))
          
          if(e.callback){
            const c = e.callback
            delete e.callback;
            c(null,s)
          }
          return s
        }
      }),
        _.drain(ready.push, ready.end)
      )
    }

    ready(...args)
  }

  
  source.push =  (...args) =>{
    if (combined == null) {
      queue.push(...args)
      return
    }
    
    combined.push(...args)
  }

  source.listen = (addr, _params) => {
    const opts = utils.defaults(params,_params || {})
    listeners.push(listen( defaultUrl(addr, opts),opts))
  }

  source.on = network.on
  source.map = network.map
  source.combine = network.combine
  source.asyncMap = network.asyncMap
  source.protoNames = network.protoNames
  source.end =() => {
    if (end == null) return
    if (closed == false) {
      closed = true
      setTimeout(function close() {
        if (end == null) return
        for (let i in connections) {
          let c = connections[i]
          if (_.isFunction(c)) c()
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