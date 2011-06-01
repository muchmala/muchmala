var _ = require('../../shared/underscore')._;
var child = require('child_process');
var fs = require('fs');

var UPLOADED_IMAGES_DIR = __dirname + '/../../uploaded';

module.exports = function(server) {
    server.post('/create', function(req, res) {
        req.form.complete(function(err, fields, files){
            var userId = req.cookies.user_id;
            var errors = [];
        
            fields.size = parseInt(fields.size);
        
            if (!_.include([90, 120, 150], fields.size)) {
                errors.push('piecesSize');
            }
        
            if (_.isUndefined(files.image)) {
                errors.push('imageAbsent');
            }
        
            if (!_.isUndefined(files.image) && 
                files.image.type != 'image/jpeg' && 
                files.image.type != 'image/png') {
                errors.push('imageFormat');
            }
        
            if (_.isUndefined(files.image) && errors.length) {
                res.end(JSON.stringify({errors: errors}));
                return;
            }
        
            var dirPath = UPLOADED_IMAGES_DIR + '/' + userId;
            var imgHash = Math.random().toString().substr(2);
            var imgPath = dirPath + '/' + imgHash + '_' + files.image.name;
        
            fs.mkdir(dirPath, '0777', function() {
                copyFile(files.image.path, imgPath, function() {
                    var options = {
                        name: fields.name,
                        size: fields.size,
                        imgPath: imgPath,
                        userId: userId
                    };
                    var onSuccess = function(data) {
                        res.end(JSON.stringify(data));
                    };
                    var onError = function(code) {
                        if (code == 101) {
                            res.end(JSON.stringify({errors: ['imageSizeBig']}));
                        } else if (code == 102) {
                            res.end(JSON.stringify({errors: ['imageSizeSmall']}));
                        } else {
                            res.end(JSON.stringify({errors: ['fatal']}));
                        }
                    };
                    buildPuzzle(options, onSuccess, onError);
                })
            });
        });    
    });
};

function buildPuzzle(options, onSuccess, onError) {
    //var builder = child.spawn('node', [
    var builder = child.spawn('/home/borbit/repositories/nave/installed/0.4.8/bin/node', [
        __dirname + '/../scripts/createPieces.js',
        '-i', options.imgPath, 
        '-n', options.name,
        '-ps', options.size,
        '-u', options.userId,
        '-v'
    ]);
    builder.stdout.on('data', function (data) {
        onSuccess(JSON.parse(data));
    });
    builder.stderr.on('data', function (data) {
        onError();
    });
    builder.on("exit", function(code) {
        if (code == 1) {
            child.spawn('jake', ['static-upload']);
        } else {
            onError(code);
        }
    });
}

function copyFile(source, dest, callback) {
    child.spawn("cp", ['-r', source, dest]).on("exit", callback);
}