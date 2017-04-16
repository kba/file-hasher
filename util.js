const crypto = require('crypto')
const path = require('path')

function normalizeFilename(filename, root) {
    if (filename.indexOf('/') !== 0) {
        filename = path.resolve(root, filename)
    }
    return filename.replace(root, '.')
}

function md5str(str) {
    const _hash = crypto.createHash('md5')
    _hash.update(str)
    return _hash.digest('hex')
}


module.exports = {
    normalizeFilename,
    md5str,
}
