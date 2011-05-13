var config = exports;
config.DEV = true;

config.HTTP_HOST = '0.0.0.0';
config.HTTP_PORT = 80;

config.IO_HOST = '33.33.33.15';
config.IO_PORT = 80;

config.STATIC_HOST = '33.33.33.15';
config.STATIC_PORT = 8080;

config.MAIN_DOMAIN = 'muchmala.com';

config.MONGODB_HOST     = '127.0.0.1';
config.MONGODB_USER     = 'mongodb';
config.MONGODB_DATABASE = 'muchmala';

config.REDIS_HOST = '33.33.33.15';
config.REDIS_PORT = 6379;
config.REDIS_PASSWORD = undefined;

config.AWS_KEY      = null;
config.AWS_SECRET   = null;
config.S3_BUCKET_MAIN   = 'dev.muchmala.com';
config.S3_BUCKET_STATIC = 'static.dev.muchmala.com';

config.UTILS_DB = __dirname + '/utils.db';

config.TWITTER_KEY = '';
config.TWITTER_SECRET = '';
config.FACEBOOK_ID = '';
config.FACEBOOK_SECRET = '';
config.GOOGLE_ID = '';
config.GOOGLE_SECRET = '';
config.YAHOO_ID = '';
config.YAHOO_SECRET = '';

try {
    var config_local = require('./config.local.js');
    for (var key in config_local) {
         config[key] = config_local[key];
    }
}catch(e) {}
