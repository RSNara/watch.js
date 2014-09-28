#!/usr/bin/env node

var fs = require('fs');
var Rsync = require('rsync');
var path = require('path');
var getopt = require('node-getopt');

var opt = getopt.create([
        ['i', 'identity=ARG', 'Specify id_rsa file location (default is `~/.ssh/id_rsa`).'],
        ['h', 'help', 'Display this help.'],
        ['v', 'version', 'Display version number.']
    ])
    .bindHelp()
    .parseSystem();

if (opt.argv.length < 2) {

    process.stderr.write("watch.js: missing file operands\nTry `watch.js --help' for more information.\n");

} else {

    var destination = opt.argv[1];
    var source = opt.argv[0];
    var identity = opt.options.identity || '~/.ssh/id_rsa';

    if (destination && source && destination && process.argv.length >= 3) {

        fs.exists(source, function(exists) {
            if (exists) {
                fs.watch(source, (function() {

                    function sync() {
                        var rsync = new Rsync()
                            .flags('avz')
                            .set('e', "ssh -i " + identity)
                            .source(source)
                            .destination(destination);

                        rsync.execute(function(error, code, cmd) {
                            console.log(!code ? 'SUCCESS:' : 'FAIL:', cmd);
                            if (error) handleError(error);
                        }, function() {}, function (stderr) {
                            process.stderr.write(stderr);
                        });
                    }

                    return sync() || sync;

                }()));

            } else {
                handleError(Error("File does not exist."));
            }
        });

    } else {
        handleError(Error("Enter a file to watch."));
    }
}

// error handler
function handleError(error) {
    process.stderr.write(error.message + '\n');
}
