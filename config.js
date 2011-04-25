var config = exports;
config.DEV = true;

config.HTTP_HOST = '33.33.33.15';
config.HTTP_PORT = 80;

config.STATIC_HOST = '33.33.33.15';
config.STATIC_PORT = 8080;

config.MONGODB_HOST     = '127.0.0.1';
config.MONGODB_USER     = 'mongodb';
config.MONGODB_DATABASE =  'muchmala';

try {
    var config_local = require('./config.local.js');
    for (var key in config_local) {
         config[key] = config_local[key];
    }
}catch(e) {}