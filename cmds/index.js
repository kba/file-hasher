const FileHasher = require('../file-hasher')
const readline = require('readline');

exports.command = 'index [files..]'
exports.desc = 'Index a bunch of files'
exports.builder = {
    'hash.algo': {
        type: 'string',
        description: 'Hash algorithm',
        enum: ['md5'],
        default: 'md5',
    },
    'hash.maxlen': {
        type: 'number',
        description: 'Bytes to read. -1 for full file',
        default: -1,
    },
}
exports.handler = function (argv) {
    argv.plugin_opts = {}
    ;['stat', 'hash'].forEach(plugin => {
        argv.plugin_opts[plugin] = argv[plugin]
        delete argv[plugin]
    })

    // console.log(argv)

    FileHasher.loadDatabase(argv, (err, fh) => {
        const queue = fh.queueFiles()
        queue.drain(err => {
            console.log("[indexing finished]")
        })
        const files = argv.files.map(x => x.toString())
        // if (files.length === 0) files.push('.')
        if (files.length === 0 || files[0] == '-') {
            files.shift()
            const rl = readline.createInterface({
                input: process.stdin,
            });
            rl.on('line', line => queue.push(line))
            rl.resume()
        }
        queue.push(files)
        // process.exit()
        delete argv[files]

    })
}
