var test = require('tape')
var _ = require('icebreaker')
var Peer = require('./')
var cl = require('chloride')
var Peer = require('./')

function authenticate(id, cb) {
  cb(null, true)
}

var alice = cl.crypto_sign_keypair()
var peer = Peer({ keys: alice, authenticate: authenticate, appKey: 'alligator@1.0.0' })
peer.listen('shs+tcp://localhost:9090')

test('shs+tcp', function (t) {
  t.plan(4)
  _(
    peer,
    peer.on({
      ready: function (e) {
        t.equal(e.address.length, 1)
        peer.connect(e.address[0])
      },
      connection: function (e) {
        _(['hello world'], e, _.drain(function (d) {
          t.equal('hello world', d.toString())
        }, function () {
          peer.end()
        }))
      },
      end: t.notOk
    })
  )


})

test('shs+tcp+unix', function (t) {
  peer = Peer({ keys: alice, authenticate: authenticate, appKey: 'alligator@1.0.0' })
  peer.listen('shs+tcp+unix:///C/Users/Markus/AppData/Local/Temp/alligator.sock')

  t.plan(4)
  _(
    peer,
    peer.on({
      ready: function (e) {
        t.equal(e.address.length, 1)
        peer.connect(e.address[0])
      },
      connection: function (e) {
        _(['hello world'], e, _.drain(function (d) {
          t.equal('hello world', d.toString())
        }, function () {
          peer.end()
        }))
      },
      end: t.notOk
    })
  )
})
