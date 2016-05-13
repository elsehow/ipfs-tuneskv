'use strict'
const exec = require('child_process').exec
const metadata = require('musicmetadata')
const read = require('fs').createReadStream

function escape (str) {
  return "'" + str.replace(/'/g, "'\"'\"'") + "'" 
}

// adds file at `path` to ipfs
// calls back (err, hash)
function addToIpfs (path, cb) {
  return exec(`ipfs add -q ${path} | tail -n1`, (err, hash) =>  {
    if (hash)
      hash=hash.trim()
    cb(err, hash)
  })
}

module.exports = (kv) => {

  // adds db entry with hash `h` and metadata `m`
  function _dbEntry (h, m) {
    return {
      ipfsHash: h,
      metadata: m,
    }
  }

  function add (song, cb) {

    function handle (err) {
      return cb(err, null)
    }

    return metadata(read(song), function (err, mdata) {
      if (err)
        return handle(err)
      let path = escape(song)
      return addToIpfs(path, (err, hash) => {
        if (err)
          return handle(err)
        return kv.put(hash, _dbEntry(hash, mdata), cb)
      })
    });
  }

  return {
    add: add,
  }
}
