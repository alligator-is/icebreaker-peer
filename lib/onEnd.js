var _ = require('icebreaker')

module.exports = function (api) {

  return function onEnd(params, cb) {
    var connections = api.connections;
    var lastId = api.lastId;
    var id = ++api.lastId;
    var source = params.source, sink = params.sink
    var ended = false, _ended = false
  
    var del = function () {
      if (ended === true && _ended === true) {
        var connection = connections[id]
        delete connections[id]
        del = null
        params = null
        if (cb) cb(connection)
      }
    }

    params.source = function (end, cb) {
        source(end, function (end, data) {
            if (end) ended = true
            cb(end, data)
            if (end && del) del()
        })
    }

    params.sink = function (read) {
        sink(function (abort, cb) {
            if (abort) {
                _ended = true
                if (del) del()
                return read(abort, cb)
            }
            read(abort, function (end, data) {
                cb(end, data)
                if (end) _ended = true
                if (end && del) del()
            })
        })
    }

    connections[id] = function(){
        if(params != null&& _.isFunction(params.end))params.end()
    }
    return params
  }
}