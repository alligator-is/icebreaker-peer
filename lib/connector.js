const _ = require('icebreaker')
const connect = require('./connect')
const utils = require('icebreaker-network/lib/util')

function connector(params) {   
  const notify = _.pushable(function(){
  });
  
  let first = false;
  
  const source = (...args) =>{
    if(first===false){
      first=notify(...args)
      process.nextTick(()=>notify.push({type:'ready'}))
      return first
    }
    return notify(...args)
  }

  source.connect = (addr,_params,cb)=>{
    if(_.isFunction(_params) ){
      cb = _params;
      _params=null;
    }
    connect(addr,utils.defaults(params,_params||{}),function(err,connection){
      if(cb && err) return cb(err)
      if(err)return
      if(cb)connection.callback = cb
      notify.push(connection);
    })
    
  }

  source.end=() => notify.end(true)

  return source;
}


module.exports = connector