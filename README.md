# icebreaker-peer
icebreaker Peer API based on icebreaker-network.

[![Travis](https://img.shields.io/travis/alligator-io/icebreaker-peer.svg)](https://travis-ci.org/alligator-io/icebreaker-peer)
[![NPM](https://img.shields.io/npm/dm/icebreaker-network.svg)](https://www.npmjs.com/package/icebreaker-peer)

## Example
```javascript
const _ = require('icebreaker')
const cl = require('chloride')
const Peer = require('icebreaker-peer')

const alice = cl.crypto_sign_keypair()
const bob = cl.crypto_sign_keypair()

function authenticate(id, cb) {
    cb(null, true)
}

const peer = Peer({ keys: alice, authenticate: authenticate, appKey: 'example@1.0.0' })
peer.listen('shs+tcp://localhost:9090')

_(
    peer,
    peer.on({
        ready: (e) =>{
            console.log('ready')
            peer.connect(e.address[0])
        },
        connection: (e) =>{
            console.log('connection',e)
            _(['hello','world'], e, _.drain((e) =>{
                console.log('drain', e.toString());
            }, peer.end))
        },
        end: (err) =>{
            console.log('ended');
            if (err) throw err
        }
    })
)
  
  ```
## Licence
MIT
