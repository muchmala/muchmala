var config = exports;
config.DEV = true;

config.HTTP_HOST = '33.33.33.15';
config.HTTP_PORT = 80;

config.IO_HOST = '33.33.33.15';
config.IO_PORT = 8000;

config.STATIC_HOST = '33.33.33.15';
config.STATIC_PORT = 8080;
config.STATIC_VERSION_FILE = 'static_version';

config.MONGODB_HOST     = '127.0.0.1';
config.MONGODB_USER     = 'mongodb';
config.MONGODB_DATABASE =  'muchmala';

config.AWS_KEY      = null;
config.AWS_SECRET   = null;
config.AWS_BUCKET   = 'static.muchmala.com';

try {
    var config_local = require('./config.local.js');
    for (var key in config_local) {
         config[key] = config_local[key];
    }
}catch(e) {}
