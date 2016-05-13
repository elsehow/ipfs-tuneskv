'use strict'
const test = require('tape')
const tuneskv = require('..')
const hyperlog = require('hyperlog')
const hyperkv = require('hyperkv')
const memdb = require('memdb')
const sub = require('subleveldown')
const indexer = require('hyperlog-index')
// testing data
const goodSong = require('path').join(__dirname, 'ex.mp3')
const goodSongAlbumName = 'Inspiration Information'
const notSong = require('path').join(__dirname, 'bad-ex.png')

function newKv() {
  let db = memdb()
  let log = hyperlog(memdb(), { valueEncoding: 'json' })
  let kv = hyperkv({
    log: hyperlog(sub(db, 'log'), { valueEncoding: 'json' }),
    db: sub(db, 'kv')
  })
  return kv
}

test('can add a good song', t => {
  let tkv = tuneskv(newKv())
  tkv.add(goodSong, (err, node) => {
    if (err) console.log('err!', err)
    if (node) {
      // should have ex.mp3 id3 tags
      // and ipfs hash for ex.mp3
      t.ok(node.value.v.ipfsHash,
           'node.value.v has ipfsHash')
      t.deepEquals(node.value.v.metadata.album,
                   goodSongAlbumName,
                   'node.value.v has metadata.album')
      t.deepEquals(node.value.k,
                   node.value.v.ipfsHash,
                   'node.value.k === node.value.v.ipfsHash')
      console.log(node.value.v)
      t.end()
    }
  })
})


test('errors when i try to add a bad song', t => {
  let tkv = tuneskv(newKv())
  tkv.add(notSong, (err, node) => {
    t.ok(err)
    t.notOk(node)
    t.end()
  })
})


test('can run a hyperlog index alongside tuneskv', t=> {
  let hdb = memdb()
  let log = hyperlog(sub(hdb, 'log'), { valueEncoding: 'json' })
  let kv = hyperkv({
    log: log,
    db: sub(hdb, 'kv'),
  })
  // make a tuneskv
  let tkv = tuneskv(kv)
  //make a hyperlog index
  let idb = memdb()
  var db = sub(idb, 'x', { valueEncoding: 'json' })
  let dex = indexer({
    log: log,
    db: sub(idb, 'i'),
    map: function (row, next) {
      let a = row.value.v.metadata.album
      db.get(a, function (err, doc) {
        if (!doc) doc = {}
        doc[row.key] = row.value.v
        db.put(a, doc, next)
      })
    }
  })

  // add something to tuneskv when dex is ready
  dex.ready(function () {
    tkv.add(goodSong, (err, res) => {
      t.notOk(err)
      t.ok(res)
      // Retrieve song from its album name
      setTimeout(() => {
        db.get(goodSongAlbumName,(err, res) => {
          t.notOk(err)
          t.ok(res)
          console.log(res)
          t.end()
        })
      }, 100)
    })
  })

})
