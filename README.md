# icebreaker-peer
icebreaker Peer API based on icebreaker-network.

[![Travis](https://img.shields.io/travis/alligator-io/icebreaker-peer.svg)](https://travis-ci.org/alligator-io/icebreaker-peer)
[![NPM](https://img.shields.io/npm/dm/icebreaker-network.svg)](https://www.npmjs.com/package/icebreaker-peer)

## Example
```javascript
var _ = require('icebreaker')
var cl = require('chloride')
var Peer = require('icebreaker-peer')

var alice = cl.crypto_sign_keypair()
var bob = cl.crypto_sign_keypair()

function authenticate(id, cb) {
    cb(null, true)
}

var peer = Peer({ keys: alice, authenticate: authenticate, appKey: 'example@1.0.0' })
peer.listen('shs+tcp://localhost:9090')

_(
    peer,
    peer.on({
        ready: function (e) {
            console.log('ready')
            peer.connect(e.address[0])
        },
        connection: function (e) {
            console.log('connection',e)
            _(['hello','world'], e, _.drain(function (e) {
                console.log('drain', e.toString());

            }, function () {
                peer.end()
            }))
        },
        end: function (err) {
            console.log('ended');
            if (err) throw err
        }
    })
)
  
  ```
## Licence
MIT
