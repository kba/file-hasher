#!/usr/bin/env node
/* globals __filename */

var argv = require('yargs')
    .commandDir('cmds')
    .demandCommand()
    .help()
    .alias('h', 'help')
    .usage("$0 <cmd> <cmd-args>")
    .options({
        db: {
            type: 'string',
            description: 'Database to use',
            default: './.filehash.db',
        },
        jobs: {
            type: 'number',
            description: 'Parallel files',
            default: 4,
        },
        force: {
            type: 'boolean',
            description: 'Force operation',
            default: false,
        },
        'stat.recursive': {
            type: 'boolean',
            description: 'recurse sub directories',
            default: 'false',
        },
        'stat.root': {
            type: 'string',
            description: 'Root directory of filenames',
            default: process.cwd()
        },
    })
    .argv;

// const {statFile, hashFile} = require('.')

// const db = {}

// statFile({filename: __filename})
//     .then(_ => hashFile(_, {algo: 'md5', length: 10240}))
//     .then(fobj => console.log(fobj))
//     .catch(err => console.log(err))
