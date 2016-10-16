var connect = require('icebreaker-network').connect;
var utils = require('icebreaker-network/lib/util')
var Notify = require('pull-pushable');

function connector(params) {   
  var notify = Notify(function(){
  });

  var source = function () {
    return notify.apply(null, [].slice.call(arguments))
  }

  source.connect = function(addr,_params,cb){
    if(utils.isFunction(_params) ){
      cb = _params;
      _params=null;
    }

    connect(addr,utils.defaults(params,_params),function(err,connection){
      if(cb && err) return cb(err)
      if(err)return
      if(cb)connection.callback = cb
      notify.push(connection);
    })
    
  }

  notify.push({type:'ready'})

  source.end=function(){
    notify.end(true)
  }

  return source;
}


module.exports = connector