#!/usr/bin/env node

var fs = require('fs');
var Rsync = require('rsync');
var async = require('async');
var path = require('path');
var getopt = require('node-getopt');

var opt = getopt.create([
        ['i', 'identity=ARG', 'Specify id_rsa file location (default is `~/.ssh/id_rsa`).'],
        ['t', 'time=ARG', 'Specify the minimum time period between successive rsyncs in ms.'],
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
    var time = opt.options.time || 250;

    async.filter(source, fs.exists, function(results) {

        // this check does 100% gurantee that the files exist by the time we start binding to them
        // could be a source of error

        var sync = (function() {

            var doRsync = true;
            var rsyncCount = 0;

            process.stdin.on('data', function(data) {
                if (data.toString().toLowerCase().trim() == 'sync') {
                    sync(results);
                }
            });

            // toggle doRsync after a unit of time
            function flipRsync(ms) {
                doRsync = false;
                setTimeout(function(){
                    doRsync = true;
                }, ms);
            }

            // perform rsync
            function sync(files) {

                if (doRsync) {

                    var data = [];
                    rsyncCount++;

                    var rsync = new Rsync()
                        .flags('avz')
                        .set('e', "ssh -i " + identity)
                        .set('stats')
                        .source(files.join(' '))
                        .destination(destination);

                    opt.options.delete ? rsync.set('delete') : null;

                    rsync.execute(function(error, code, cmd) {
                        var fileList = data.slice(1, data.length - 14).join(', ');
                        console.log(
                            'rsync%s #%d [%s]: %s',
                            opt.options.delete ? " -d" : "",
                            rsyncCount,
                            !code ? 'SUCCESS' : 'FAILURE',
                            fileList.length ? fileList : 'NOTHING'
                        );
                        error ? handleError(error) : null;
                    }, function(stdout) {
                        data = data.concat(stdout.toString().trim().split('\n'));
                    }, function (stderr) {
                        console.error(stderr);
                    });

                    // doRsync = false; toggle after time seconds
                    flipRsync(time);

                }

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
