var test = require('tape')
var _ = require('icebreaker')
require('./')

var net = require('net')
var count = 0

var peer = _.peer({
  name: 'testPeer',
  start: function () {
    count++
    this.address = '127.0.0.' + count
    this.emit('started')
  },
  connect: function (params) {
    var a = _.pair()
    var b = _.pair()

    if (peer2.address == params.address) {
      peer2.connection({
        source: a.source,
        sink: b.sink,
        address: params.address
      })
    }

    this.connection({
      source: b.source,
      sink: a.sink,
      direction: params.direction
    })
  },

  stop: function () {
    if (Object.keys(this.connections).length === 0) {
      this.emit('stopped')
    }
  }
})

var peer1 = peer()
var peer2 = peer()

test('start', function (t) {
  peer1.once('started', function () {
    t.pass('started')
    t.end()
  })

  peer1.start()
  peer2.start()
})

test('connect: peer1->peer2', function (t) {
  peer1.on('connection', function (connection) {
    t.equal(connection.type, 'testPeer')
    t.equal(typeof connection.source, 'function')
    t.equal(typeof connection.sink, 'function')
    t.equal(typeof connection.address, 'string')
    t.equal(typeof connection.id, 'string')
    t.equal(connection.direction, 1)
    t.ok(net.isIP(connection.address))
    t.equal(Object.keys(peer1.connections).length, 1)

    _(
      connection,
      _.map(function (text) {
        t.equal(text, 'hello')
        return "world"
      }),
      connection
    )
  })

  peer2.on('connection', function (connection) {
    t.equal(connection.direction, -1)
    t.test('peer2->peer1->peer2', function (t2) {

      _(
        'hello',
        connection,
        _.drain(function (data) {
            t2.equal(data, 'world')
        },
        function (err) {
          t2.end(err)
          t2.equal(Object.keys(peer2.connections).length, 1)
        })
      )

      t2.equal(Object.keys(peer2.connections).length, 0)
      t2.equal(Object.keys(peer1.connections).length, 0)
    })
  })
  peer1.connect(peer2)
})

test('stop', function (t) {
  t.plan(2)

  peer1.once('stopped', function () {
    t.pass('stopped')
  })

  peer2.once('stopped', function () {
    t.pass('stopped')
  })

  peer1.stop()
  peer2.stop()
})
