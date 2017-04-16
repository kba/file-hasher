const fs = require('fs')
const crypto = require('crypto')

module.exports = class hash {

    constructor({algo='md5', maxlen=-1}) {
        this.algo = algo
        this.maxlen = maxlen
    }

    isUpToDate(cur, old) {
        if ((this.maxlen <= 0 || this.size <= this.maxlen) && !(this.algo in old))
            return false
        if (this.maxlen > 0 && !(`${this.algo}_${this.maxlen}` in old))
            return false
        return true
    }

    process(fobj, queue, cb) {
        let {algo, maxlen} = this
        let {filename, size} = fobj
        const hash = crypto.createHash(algo)
        const is = maxlen <= 0
            ? fs.createReadStream(filename)
            : fs.createReadStream(filename, {start: 0, end: maxlen - 1})
        is.on('error', cb)
        is.on('end', () => {
            const digest = hash.digest('hex')
            if (maxlen <= 0)
                fobj[algo] = digest
            else if (size <= maxlen) {
                fobj[algo] = digest
                fobj[`${algo}_${maxlen}`] = digest
            } else {
                fobj[`${algo}_${maxlen}`] = digest
            }
            return cb(null, fobj)
        })
        is.on('data', chunk => {
            // if (maxlen > 0) console.log(`[read ${chunk.length}] ${filename}`);
            hash.update(chunk)
        })

    }
}


