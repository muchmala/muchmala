var config = exports;
config.DEV = true;

config.HTTP_HOST = '0.0.0.0';
config.HTTP_PORT = 80;

config.MAIN_URL   = 'http://muchmala.dev';

config.STATIC_HOST = 'static.muchmala.dev';
config.STATIC_PORT = 8080;
config.STATIC_URL = 'http://' + config.STATIC_HOST + ':' + config.STATIC_PORT;

config.MONGODB_HOST     = '127.0.0.1';
config.MONGODB_USER     = 'mongodb';
config.MONGODB_DATABASE = 'muchmala';

config.REDIS_HOST       = '127.0.0.1';
config.REDIS_PORT       = 6379;
config.REDIS_PASSWORD   = undefined;
config.REDIS_DATABASE   = 0;

config.AWS_KEY          = null;
config.AWS_SECRET       = null;
config.S3_BUCKET_MAIN   = 'dev.muchmala.com';
config.S3_BUCKET_STATIC = 'static.dev.muchmala.com';

config.UTILS_DB = __dirname + '/utils.db';

config.TWITTER_KEY      = '';
config.TWITTER_SECRET   = '';
config.FACEBOOK_ID      = '';
config.FACEBOOK_SECRET  = '';
config.GOOGLE_KEY       = '';
config.GOOGLE_SECRET    = '';
config.YAHOO_KEY        = '';
config.YAHOO_SECRET     = '';

config.FRONTEND_SERVERS = [
    {externalHost: 'muchmala.dev', externalPort: 80, internalPort: 8081} //can be only one for now
];

config.IO_SERVERS = [
    {externalHost: 'io1.muchmala.dev', externalPort: 80, internalPort: 8082},
    {externalHost: 'io2.muchmala.dev', externalPort: 80, internalPort: 8083}
];

config.APP_SERVERS_COUNT = 1; //can be only one for now

try {
    var config_local = require('./config.local.js');
    for (var key in config_local) {
         config[key] = config_local[key];
    }
}catch(e) {}
