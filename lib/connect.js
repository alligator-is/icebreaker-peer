const _ = require('icebreaker')
const connect = require('icebreaker-network').connect;
const defaultUrl = require('./defaultUrl')
const utils = require('icebreaker-network/lib/util')
module.exports=(addr,_params,cb)=>{
    if(_.isFunction(_params) ){
      cb = _params;
      _params={};
    }
    connect(defaultUrl(addr,_params),_params,(err,e)=>{
      if(err) return cb(err)
      let peerID
      if (e.address != null && !e.remote) {
        try {  peerID= utils.parseUrl(e.address).auth || null }
        catch (err) {}
      }
      if (e.remote && !peerID) peerID = e.remote
      delete e.remote

      if (peerID != null) e.peerID = peerID     

      cb(err,e)
    })
}