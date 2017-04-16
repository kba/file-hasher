const nedb = require('nedb-core')
const async = require('async')
const {md5str} = require('./util')
const hash = require('./plugin/hash')
const stat = require('./plugin/stat')

class FileHasher {

    constructor({db, jobs=4, force=false, plugins=['stat', 'hash'], plugin_opts={}}) {
        this.db = db
        if (plugins.indexOf('stat') == -1) plugins.unshift('stat')
        this.force = force
        this.jobs = jobs
        this.plugins = plugins.map((cls) => {
            return new(pluginClasses[cls])(plugin_opts[cls] || {})
        })
        this._ignore = [
            new RegExp(".*filehash.db$")
        ]
    }

    ignored(filename) {
        return this._ignore.find(re => re.test(filename))
    }

    getPlugin(name) {
        return this.plugins.find(plugin => plugin.constructor.name === name)
    }

    indexFile(fobj, cb) {
        // _id is the hashed filename
        const _id = md5str(fobj.filename)
        this.db.update({_id}, Object.assign(fobj, {_id}), {upsert: true}, err => {
            // TODO detect moves
            console.log(`[indexed] ${fobj.filename}`)
            // console.log(`[indexed] ${fobj.filename}`, fobj)
            cb(err)
        })
    }

    refreshFile(filename, queue, done) {
        const fobj = {filename}
        if (this.ignored(filename)) {
            console.log(`[ignored] ${filename}`)
            return done()
        }
        this.getPlugin('stat').process(fobj, queue, (err) => {
            var {filename} = fobj
            if (err) return done()
            const foundPromise = new Promise((resolve, reject) => {
                this.db.findOne({filename: fobj.filename}, (err, old) => {
                    return err ? reject(err) : resolve(old)
                })
            })
            async.some(this.plugins, (plugin, doneOutdated) => {
                if (this.force) {
                    console.log(`[forced - ${plugin.constructor.name}] ${filename}`)
                    return doneOutdated(true)
                }
                foundPromise.then(old => {
                    if (!old) {
                        console.log(`[initial - ${plugin.constructor.name}] ${filename}`)
                        return doneOutdated(true)
                    }
                    if (!plugin.isUpToDate(fobj, old)) {
                        console.log(`[out of date - ${plugin.constructor.name}] ${filename}`)
                        return doneOutdated(true)
                    }
                    // console.log(`[up to date - ${plugin.constructor.name}] ${filename}`)
                    return doneOutdated()
                })
            }, (outdated) => {
                if (!outdated) {
                    // console.log(`[up to date] ${filename}`)
                    return done()
                }
                console.log(`[out of date] ${filename}`)
                async.forEach(this.plugins, (plugin, doneProcess) => {
                    return plugin.process(fobj, queue, doneProcess)
                }, err => {
                    return this.indexFile(fobj, done)
                })
            })
        })
    }

    queueFiles(files=null) {
        const queue = async.queue((filename, done) => {
            this.refreshFile(filename, queue, done)
        }, this.jobs)
        if (files) queue.push(files)
        return queue
    }

    static loadDatabase(options, cb) {
        // const rootHash = _md5str(options.stat.root)
        // if (options.tmpfs && options.stat.root) {
        // }
        options.db = new nedb({filename: options.db}) 
        options.db.loadDatabase(err => {
            if (err) return cb(err)
            return cb(null, new FileHasher(options))
        })
    }

}

module.exports = FileHasher
const pluginClasses = {hash, stat}
FileHasher.plugins = pluginClasses

