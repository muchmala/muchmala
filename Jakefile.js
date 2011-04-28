var config = require('./config.js');
var fs = require('fs');
var path = require('path');
var knox = require('knox');
var flow = require('flow');



desc('upload static files to S3');
task('static-upload', [], function () {
    var staticVersion = fs.readFileSync(config.STATIC_VERSION_FILE);
    var uploadFiles = [
        ['client/css/minified.css', staticVersion + '/css/minified.css'],
        ['client/js/minified.js',   staticVersion + '/js/minified.js']
    ];

    var puzzlesFiles = getPuzzlesFiles('client/img/puzzles');
    puzzlesFiles.forEach(function(puzzleFile) {
        var parts = puzzleFile.split('/');
        parts.shift();
        var url = parts.join('/');
        uploadFiles.push([puzzleFile, url]);
    });

    var s3client = createS3Client();
    flow.serialForEach(uploadFiles,
        function(uploadFile) {
            var src = uploadFile[0];
            var dst = uploadFile[1];
            console.log('Uploading ' + src + ' to S3 http://s3.amazonaws.com/' + config.AWS_BUCKET + '/' + dst);
            s3client.upload(src, dst, this);
        }, function(err) {
            if (err) {
                throw err;
            }
            complete();
        }
    );
}, true);



//
// helpers
//
function getPuzzlesFiles(puzzlesDir) {
    var puzzlesFiles = [];
    var files = fs.readdirSync(puzzlesDir);
    files.forEach(function(file) {
        var fullpath = path.join(puzzlesDir, file);
        if (fs.statSync(fullpath).isDirectory()) {
            // this is a puzzle!
            var puzzleFiles = scanFiles(fullpath);
            puzzlesFiles = puzzlesFiles.concat(puzzleFiles);
        }
    });
    return puzzlesFiles;
}

function scanFiles(dir) {
    // TODO: make it recursive
    var files = fs.readdirSync(dir);
    files = files.filter(function(file) {
        return (file != '.DS_Store');
    });
    files = files.map(function(file) {
        return path.join(dir, file);
    });
    return files;
}

function createS3Client() {
    if (!config.AWS_KEY || !config.AWS_SECRET) {
        fail('AWS_KEY and/or AWS_SECRET are not defined in config');
    }

    var knoxClient = knox.createClient({
        key: config.AWS_KEY,
        secret: config.AWS_SECRET,
        bucket: config.AWS_BUCKET
    });

    return new S3Client(knoxClient);
}

function S3Client(knoxClient) {
    this.knoxClient = knoxClient;
}

S3Client.prototype.upload = function(src, dst, callback) {
    this.knoxClient.putFile(src, dst, function(err, res) {
        if (err) {
            return callback(err);
        }

        if (res.statusCode != 200) {
            var message = 'PUT Failed!\n';
            message += 'HTTP ' + res.statusCode + '\n';
            message += JSON.stringify(res.headers);
            return callback(new Error(message));
        }

        callback(null);
    });
};
