#!/usr/bin/env node

var fs = require('fs');
var Rsync = require('rsync');
var async = require('async');
var path = require('path');
var getopt = require('node-getopt');

var opt = getopt.create([
        ['i', 'identity=ARG', 'Specify id_rsa file location (default is `~/.ssh/id_rsa`).'],
        ['d', 'delete', 'Delete extraneous files from remote on each rsync.'],
        ['h', 'help', 'Display this help.'],
        ['v', 'version', 'Display version number.']
    ])
    .bindHelp()
    .parseSystem();

if (opt.argv.length < 2) {

    process.stderr.write("watch.js: missing file operands\nTry `watch.js --help' for more information.\n");

} else {

    var destination = opt.argv[opt.argv.length - 1];
    var source = opt.argv.slice(0, opt.argv.length - 1);
    var identity = opt.options.identity || '~/.ssh/id_rsa';

    async.filter(source, fs.exists, function(results) {

        // meh, we don't have 100% gurantee that by the time we bind fs.watch
        // the files in results will all be present
        var sync = (function() {

            process.stdin.on('data', function(data) {
                if (data.toString().toLowerCase().trim() == 'sync') {
                    sync();
                }
            });

            function sync(files) {
                var rsync = new Rsync()
                    .flags('avz')
                    .set('e', "ssh -i " + identity)
                    .source(files.join(' '))
                    .destination(destination);

                opt.options.delete ? rsync.set('delete') : null;

                rsync.execute(function(error, code, cmd) {
                    console.log((!code ? 'SUCCESS' : 'FAILED ') + ' rsync [%s]: %s',
                        opt.options.delete ? '--delete' : '' , files.join(' '));
                    if (error) handleError(error);

                }, function() {}, function (stderr) {
                    process.stderr.write(stderr);
                });

            }

            return sync(results) || sync;

        }())

        if (results.length !== 0) {
            results.forEach(function(file, index) {
                fs.watch(file, function(event, filename) {
                    sync([file]);
                });
            });
        }

    });

}

// error handler
function handleError(error) {
    process.stderr.write(error.message + '\n');
}
