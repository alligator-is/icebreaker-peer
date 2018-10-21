const test = require('tape')
const _ = require('icebreaker')
const Peer = require('./')
const cl = require('chloride')
const os = require('os')
const path = require('path')

function authenticate(id, cb) {
  cb(null, true)
}

const alice = cl.crypto_sign_keypair()
let peer = Peer({ keys: alice, authenticate: authenticate, appKey: 'alligator@1.0.0' ,encoding:"base58"})
peer.listen('shs+tcp://localhost:9090')

test('shs+tcp', (t) =>{
  t.plan(4)
  _(
    peer,
    peer.on({
      ready:(e)=>{ 
        t.equal(e.address.length, 1)
        peer.connect(e.address[0])
      },
      connection:(e) =>{
        _(['hello world'], e, _.drain(function (d) {
          t.equal('hello world', d.toString())
        }, 
        peer.end
        ))
      },
      end: t.notOk
    })
  )
})

test('shs+tcp+unix', (t) => {

  peer = Peer({ keys: alice, authenticate: authenticate, appKey: 'alligator@1.0.0' })
  peer.listen('shs+tcp+unix://'+path.join("/",os.tmpdir() , '/test4.socket'))

  t.plan(4)
  _(
    peer,
    peer.on({
      ready: (e) => {
        t.equal(e.address.length, 1)
        peer.connect(e.address[0])
      },
      connection:(e) => {
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