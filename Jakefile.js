var config = require('./config.js');
var http = require('http');
var fs = require('fs');
var path = require('path');
var knox = require('knox');
var flow = require('flow');
var ejs = require('ejs');
var exec = require('child_process').exec;


//
// setup
//
var db = loadDb();
//console.log('Database:', db);

var configFiles = ['Jakefile.js', 'config.js'];
if (path.existsSync('config.local.js')) {
    configFiles.push('config.local.js');
}



//
// tasks
//

desc('start all services');
task('start', ['install'], function() {
    console.log('Starting all services...');
    exec('supervisorctl start muchmala:', function(err, stdout, stderr) {
        if (err) {
            throw err;
        }

        console.log('DONE');
        complete();
    });
}, true);



desc('stop all services');
task('stop', [], function() {
    console.log('Stopping all services...');
    exec('supervisorctl stop muchmala:', function(err, stdout, stderr) {
        if (err) {
            throw err;
        }

        console.log('DONE');
        complete();
    });
}, true);



desc('restart all services');
task('restart', ['install'], function() {
    console.log('Restarting all services...');
    exec('supervisorctl restart muchmala:', function(err, stdout, stderr) {
        if (err) {
            throw err;
        }

        console.log('DONE');
        complete();
    });
}, true);



desc('install project');
var deps = ['config', 'restart-supervisor'];
if (config.DEV) {
    deps.push('restart-nginx');
}
task('install', deps, function() {
});



desc('restart nginx');
task('restart-nginx', ['/etc/nginx/sites-enabled/muchmala.dev'], function() {
    console.log('Restarting nginx...');
    exec('service nginx restart', function(err, stdout, stderr) {
        if (err) {
            throw err;
        }

        console.log('DONE');
        complete();
    });
}, true);



desc('restart supervisor');
task('restart-supervisor', ['/etc/supervisor/conf.d/muchmala.conf', 'proxy.json'], function() {
    console.log('Restarting supervisor...');
    exec('/etc/init.d/supervisor stop', function(err, stdout, stderr) {
        if (err) {
            throw err;
        }

        exec('/etc/init.d/supervisor start', function(err, stdout, stderr) {
            if (err) {
                throw err;
            }

            console.log('DONE');
            complete();
        });
    });
}, true);



desc('generate configs');
var deps = ['/etc/supervisor/conf.d/muchmala.conf', 'proxy.json'];
if (config.DEV) {
    deps.push('/etc/nginx/sites-enabled/muchmala.dev');
}
task('config', deps, function() {
});



desc('generate supervisor config');
file('/etc/supervisor/conf.d/muchmala.conf', ['config/supervisor.conf.in'].concat(configFiles), function() {
    console.log('Generating supervisor config...');
    render('config/supervisor.conf.in', '/etc/supervisor/conf.d/muchmala.conf', {config: config});
    console.log('DONE');
});



desc('generate nginx config');
file('/etc/nginx/sites-enabled/muchmala.dev', configFiles, function() {
    console.log('Generating nginx config...');
    render('config/nginx.conf.in', '/etc/nginx/sites-enabled/muchmala.dev', {config: config});
    console.log('DONE');

    var defaultNginxSiteConfig = '/etc/nginx/sites-enabled/default';
    if (path.existsSync(defaultNginxSiteConfig)) {
        console.log('Removing default nginx config...');
        fs.unlinkSync(defaultNginxSiteConfig);
        console.log('DONE');
    }
});



desc('generate proxy config');
file('proxy.json', ['config/proxy.json.in'].concat(configFiles), function() {
    console.log('Generating proxy config...');
    render('config/proxy.json.in', 'proxy.json', {config: config});
    console.log('DONE');
});



desc('upload static files to S3');
task('static-upload', [], function() {
    var uploadFiles = [
        ['client/css/styles.css', db.staticVersion + '/css/styles.css'],
        ['client/js/minified.js',   db.staticVersion + '/js/minified.js']
    ];

    var puzzlesFiles = getPuzzlesFiles('client/img/puzzles');
    puzzlesFiles.forEach(function(puzzleFile) {
        var parts = puzzleFile.split('/');
        parts.shift();
        var url = parts.join('/');
        uploadFiles.push([puzzleFile, url]);
    });

    var coversFiles = getCoversFiles('client/img/covers');
    coversFiles.forEach(function(coverFile) {
        var parts = coverFile.split('/');
        parts.shift();
        var url = parts.join('/');
        uploadFiles.push([coverFile, url]);
    });

    // remember the filtration time
    var thisStaticUpload = Date.now();

    // filter out files that were not modified since the last upload
    uploadFiles = uploadFiles.filter(function(uploadFile) {
        var src = uploadFile[0];
        var srcInfo = fs.statSync(src);
        return (srcInfo.mtime.getTime() > db.lastStaticUpload);
    });

    if (uploadFiles.length == 0) {
        console.log('No new files to upload.');
        return;
    }

    var s3client = createS3Client(config.S3_BUCKET_STATIC);
    flow.serialForEach(uploadFiles,
        function(uploadFile) {
            var src = uploadFile[0];
            var dst = uploadFile[1];
            console.log('Uploading ' + src + ' to S3 http://s3.amazonaws.com/' + config.S3_BUCKET_STATIC + '/' + dst);
            s3client.upload(src, dst, this);
        }, function(err) {
            if (err) {
                throw err;
            }

            // update last upload time
            db.lastStaticUpload = thisStaticUpload;
            saveDb(db);

            console.log('DONE');
            complete();
        }
    );
}, true);

//
// JAVASCRIPT FILES COMPRESSION
//
var jsDir = 'client/js/';
var uncompressedJsFiles = [
    jsDir + 'jquery/jquery.scraggable/jquery.scraggable.js',
    jsDir + 'jquery/jquery.viewport/jquery.viewport.js',
    jsDir + 'jquery/jquery.scrolla/jquery.scrolla.js',
    jsDir + 'jquery/jquery.cookie.js',
    
    'shared/flow.js',
    'shared/messages.js',
    
    jsDir + 'utils.js',
    jsDir + 'third/aim.js',
    jsDir + 'backbone/backbone.js',
    jsDir + 'backbone/backbone.io.js',
    jsDir + 'loader.js',
    jsDir + 'storage.js',
    jsDir + 'server.js',
    jsDir + 'models/user.js',
    jsDir + 'models/puzzle.js',
    jsDir + 'collections/pieces.js',
    jsDir + 'collections/leaders.js',
    jsDir + 'collections/twenty.js',
    jsDir + 'views/puzzle.js',
    jsDir + 'views/piece.js',
    jsDir + 'views/viewport.js',
    jsDir + 'views/dialogs.js',
    jsDir + 'views/panel.js',
    jsDir + 'app.js'
];

var compressedJsFiles = [
    jsDir + 'socket.io/socket.io.min.js',
    jsDir + 'jquery/jquery.min.js',
    jsDir + 'jquery/jquery-ui.js',
    'shared/underscore.js'
];

var resultJsFile = jsDir + 'minified.js';

var parser = require('uglify-js').parser;
var uglify = require('uglify-js').uglify;

desc('compress JavaScript files');
task('compressjs', [resultJsFile], function() {
    console.log('DONE');
    complete();
});

file(resultJsFile, uncompressedJsFiles, function() {
    var codeToCompress = '';
    var compressdCode = '';
    
    uncompressedJsFiles.forEach(function(filePath) {
        codeToCompress += fs.readFileSync(filePath).toString();
    });
    
    compressedJsFiles.forEach(function(filePath) {
        compressdCode += fs.readFileSync(filePath).toString();
    });
    
    var ast = parser.parse(codeToCompress);
    ast = uglify.ast_mangle(ast);
    ast = uglify.ast_squeeze(ast);
    
    fs.writeFileSync(resultJsFile, compressdCode + uglify.gen_code(ast));
});

//
// STYLUS
//
var inputFile = 'client/css/styles.styl';
var stylusUrl = 'server/scripts/stylusUrl.js';

desc('Run stylus with "watch" option');
task('stylus-watch', [], function() {
    runStylus(true);
});

desc('Run stylus to render CSS once');
task('stylus-render', [], function() {
    runStylus(false, function() {
        console.log('CSS is rendered');
        complete();
    });
});

function runStylus(watch, callback) {
    var command = 'stylus';
    
    if (watch) {
        command += ' --watch';
    }
    
    command += ' --compress';
    command += ' --include client/css';
    command += ' --use ' + stylusUrl;
    command += ' ' + inputFile;

    exec(command, function(error) {
        if (error) throw error;
        if (callback) callback();
    });
}

//
// helpers
//
function trim(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

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

function getCoversFiles(coversDir) {
    var coversFiles = [];
    var files = fs.readdirSync(coversDir);
    files.forEach(function(file) {
        var fullpath = path.join(coversDir, file);
        if (fs.statSync(fullpath).isDirectory()) {
            coversFiles = coversFiles.concat(scanFiles(fullpath));
        }
    });
    return coversFiles;
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

function loadDb() {
    if (!path.existsSync(config.UTILS_DB)) {
        console.log(config.UTILS_DB + ' file not found - creating empty one.');
        fs.writeFileSync(config.UTILS_DB, '{}');
    }

    var db = JSON.parse(fs.readFileSync(config.UTILS_DB).toString());

    // backwards compatibility
    var staticVersionFile = 'static_version';
    if (path.existsSync(staticVersionFile)) {
        db.staticVersion = parseInt(trim(fs.readFileSync(staticVersionFile).toString()), 10);
        saveDb(db);
        fs.unlinkSync(staticVersionFile);
    }

    if (!db.staticVersion || db.staticVersion < 1) {
        console.log('db.staticVersion is not set or invalid - set to 1.');
        db.staticVersion = 1;
        saveDb(db);
    }

    if (!db.lastStaticUpload || db.lastStaticUpload < 0) {
        console.log('db.lastStaticUpload is not set or invalid - set to "very long time ago".');
        db.lastStaticUpload = 0;
        saveDb(db);
    }

    return db;
}

function saveDb(db) {
    return fs.writeFileSync(config.UTILS_DB, JSON.stringify(db));
}

function render(src, dst, options) {
    if (typeof(options) == 'function') {
        callback = options;
        options = {};
    }

    if (!options.root) {
        options.root = __dirname;
    }

    var template = fs.readFileSync(src).toString();
    var result = ejs.render(template, {locals: options});
    fs.writeFileSync(dst, result);
}

function createS3Client(bucket) {
    if (!config.AWS_KEY || !config.AWS_SECRET) {
        fail('AWS_KEY and/or AWS_SECRET are not defined in config');
    }

    var knoxClient = knox.createClient({
        key: config.AWS_KEY,
        secret: config.AWS_SECRET,
        bucket: bucket
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
