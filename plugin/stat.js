const path = require('path')
const fs = require('fs')
const {normalizeFilename} = require('../util')

module.exports = class stat {

    constructor({root='/', recursive=true}) {
        this.root = root
    }

    isUpToDate(cur, old) {
        if (!(Date.parse(cur.mtime) == Date.parse(old.mtime) && cur.size == old.size)) {
            return false
        }
        return true
    }

    process(fobj, queue, cb) {
        fobj.filename = normalizeFilename(fobj.filename, this.root)
        const {filename} = fobj
        fs.lstat(filename, (err, lstat) => {
            if (err) {
                console.log(`[stat error]`, err)
                return cb(err)
            }
            if (!lstat.isDirectory()) {
                const {mtime, size} = lstat
                Object.assign(fobj, {mtime, size})
                return cb()
            } else {
                if (!this.recursive) {
                    console.log(`[directory - stop] ${filename}`)
                    return cb()
                }
                console.log(`[directory - recurse] ${filename}`)
                // console.log(`[recursing - directory] ${filename}`)
                fs.readdir(filename, (err, subfilenames) => {
                    if (err) return cb(err)
                    queue.push(subfilenames.map(subfilename => path.join(filename, subfilename)))
                    return cb(true)
                })
            }
        })
    }
}


