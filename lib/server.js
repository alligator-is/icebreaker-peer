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
      if (e.remote && !e.peerID){
        e.peerID = e.remote
        delete e.remote
      }
     return e
    }
  })

  function source(...args) {
    if (ready == null) {
      let all = listeners
      if(params.listeners)all = listeners.concat(params.listeners)
      combined = combine(...all)
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
        },
        connectionError:(e)=>{
          if(e.callback){
            const c = e.callback
            delete e.callback;
            c(e.error)
          }
          return e
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
  source.paraMap = network.paraMap
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
