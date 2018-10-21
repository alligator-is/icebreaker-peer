const _ = require('icebreaker')
const connect = require('icebreaker-network').connect;
const defaultUrl = require('./defaultUrl')

module.exports=(addr,_params,cb)=>{
    if(_.isFunction(_params) ){
      cb = _params;
      _params={};
    }
    connect(defaultUrl(addr,_params),_params,cb)
}