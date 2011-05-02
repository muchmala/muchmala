var config = exports;
config.DEV = true;

config.HTTP_HOST = '0.0.0.0';
config.HTTP_PORT = 80;

config.IO_HOST = '33.33.33.15';
config.IO_PORT = 80;

config.STATIC_HOST = '33.33.33.15';
config.STATIC_PORT = 8080;

config.MONGODB_HOST     = '127.0.0.1';
config.MONGODB_USER     = 'mongodb';
config.MONGODB_DATABASE = 'muchmala';

config.AWS_KEY      = null;
config.AWS_SECRET   = null;
config.S3_BUCKET_MAIN   = 'dev.muchmala.com';
config.S3_BUCKET_STATIC = 'static.dev.muchmala.com';

config.UTILS_DB = __dirname + '/utils.db';

try {
    var config_local = require('./config.local.js');
    for (var key in config_local) {
         config[key] = config_local[key];
    }
}catch(e) {}
