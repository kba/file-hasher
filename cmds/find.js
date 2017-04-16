const FileHasher = require('../file-hasher')
const mustache = require('mustache')

exports.command = 'find'
exports.desc = 'Find'
exports.builder = {
    hash: {
        type: 'string',
        description: 'Hash to search',
    },
    remove: {
        type: 'boolean',
        description: 'Remove found',
    },
    regexp: {
        type: 'boolean',
        description: 'Treat as regex',
    },
    filename: {
        type: 'string',
        description: 'Filename to search',
    },
    format: {
        type: 'string',
        description: 'Format to use for output',
    },
    'format-filename': {
        type: 'boolean',
        description: 'Output just the filename',
    },
}
exports.handler = function (argv) {
    const query = {$and:[]}
    const algos = ['md5']
    if (argv.hash) {
        const $or = []
        const val = argv.regex ? {$regexp: new RegExp("${argv.hash")} : argv.hash
        ;algos.forEach(algo => {
            $or.push({[algo]: val})
            $or.push({[algo+'_1024']: val})
            $or.push({[algo+'_10240']: val})
            $or.push({[algo+'_102400']: val})
        })
        query.$and.push({$or})
    }
    if (argv['format-filename']) {
        argv.format = '[filename]'
    }
    if (argv.filename) {
        if (argv.regexp) {
            query.$and.push({filename: {$regex: new RegExp(argv.filename)}})
        } else {
            query.$and.push({filename: FileHasher.normalizeFilename(argv.filename, argv.stat.root)})
        }
    }
    if (argv.size) {
        query.size = argv.size
    }
    // console.log(new Date())
    FileHasher.loadDatabase(argv, (err, fh) => {
        // console.log(new Date())
        // console.log(JSON.stringify(query, null, 2))
        fh.db.find(query, (err, docs) => {
            if (argv.remove) {
                fh.db.remove({$or: docs.map(({_id}) => _id)}, err => {
                    console.log("Dropped")
                })
            }
            if (argv.format) {
                argv.format = argv.format.replace(/\[/g, '{{{').replace(/\]/g, '}}}')
                docs.forEach(doc => console.log(mustache.render(argv.format, doc)))
            } else {
                console.log(docs)
            }
        })
    })
}

