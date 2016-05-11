# ipfs-tuneskv

a hyperkv of ipfs hashes and song metadata

## Install

```
npm install ipfs-tuneskv
```

## use

make sure [ipfs-daemon](https://ipfs.io/) is running and accessible via `ipfs`

```javascript
let tuneskv = require('..')
let hyperlog = require('hyperlog')
var hyperkv = require('hyperkv')
let memdb = require('memdb')
let log = hyperlog(memdb(), { valueEncoding: 'json' })
var sub = require('subleveldown')

function newKv() {
  var db = memdb()
  var kv = hyperkv({
    log: hyperlog(sub(db, 'log'), { valueEncoding: 'json' }),
    db: sub(db, 'kv')
  })
  return kv
}

let tkv = tuneskv(newKv())
let coolSong = require('path').join(__dirname, 'ex.mp3')
tkv.add(coolSong, (err, node) => {
  if (err) console.log('err!', err)
  if (node) {
    // should have ex.mp3 id3 tags
    // and ipfs hash for ex.mp3
    console.log(node.value.v)
  }
})

```

## api

### let tkv = tuneskv(kv)

kv can be anything with a level-style put/get API - the above example uses [hyperkv](https://www.npmjs.com/package/hyperkv)

### .add(path, cb)

`path` to some song

`cb(err, v)`

If the song at `path` has valid id3 tags, will call back `cb(null, node)` with the hyperkv node of the new entry. Otherwise, will call back `cb(err, null)`.

## rationale

Thanks to hyperkv's mutli-value conflict resolution, and full history of values for each key, peers can freely update metadata for hashes without destroying past values. 

If there are multiple versions of a song's metadata, the caller could resolve conflicts e.g., by taking the union of all properties in all versions.

This kv makes metadata lookups by hash trivial. If you need to index by artist, album, etc..., use [hyperlog-index](https://www.npmjs.com/package/hyperlog-index) to build some custom index for yourself with the hyperlog you pass to hyperkv.


## license

BSD
