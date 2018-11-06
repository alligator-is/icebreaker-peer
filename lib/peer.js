const _ = require('icebreaker')
const Connector = require('./connector')
const utils = require('icebreaker-network/lib/util')
const Server = require("./server")

module.exports = function Peer(params) {
  const connector = Connector(params)
  
  if(!_.isPlainObject(params)) params ={}
  
  let listeners = [connector]
  if(params.listeners) listeners=listeners.concat(params.listeners)
  params.listeners = listeners

  const peer = Server(params)

  peer.connect = function (addr, _params, cb)
  {
    if(_.isFunction(_params)){
      cb=_params
      _params={}
    }
    connector.connect(addr,utils.defaults(params,_params),cb)
  }
 
  return peer
}
