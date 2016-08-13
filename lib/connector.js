var connect = require('icebreaker-network').connect;
var utils = require('icebreaker-network/lib/util')
var Notify = require('pull-pushable');
var utils = require('icebreaker-network/lib/util')

function connector(params) {   
  var notify = Notify(function(){
  });

  var source = function () {
    return notify.apply(null, [].slice.call(arguments))
  } 

  source.connect = function(addr,_params){
    connect(addr,utils.defaults(params,_params),function(err,connection){
      if(err) {
          console.log(err)
          return;
      }
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