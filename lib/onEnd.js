const _ = require('icebreaker')

module.exports = (api) => {
  return (params, cb) => {
    const connections = api.connections;
    const lastId = api.lastId;
    const id = ++api.lastId;
    const source = params.source, sink = params.sink
    let ended = false, _ended = false
  
    let del = () => {
      if (ended === true && _ended === true) {
        const connection = connections[id]
        delete connections[id]
        del = null
        params = null
        if (cb) cb(connection)
      }
    }

    params.source = (end, cb) => {
        source(end, (end, data) => {
            if (end) ended = true
            cb(end, data)
            if (end && del) del()
        })
    }

    params.sink = (read) => {
        sink((abort, cb) => {
            if (abort) {
                _ended = true
                if (del) del()
                return read(abort, cb)
            }
            read(abort, (end, data) => {
                cb(end, data)
                if (end) _ended = true
                if (end && del) del()
            })
        })
    }

    connections[id] = ()=>{ if(params != null&& _.isFunction(params.end)) params.end() }
    return params
  }
}