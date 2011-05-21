var fs = require('fs');
var db = require('./db');
var auth = require('connect-auth');
var form = require('connect-form');
var config = require('../config');
var express = require('express');
var controllers = require('./controllers');

var UPLOADED_IMAGES_DIR = __dirname + '/../uploaded';

var utilsDb = JSON.parse(fs.readFileSync(config.UTILS_DB).toString());

var server = express.createServer();

db.connect(function() {});

server.set('view engine', 'html');
server.set('views', __dirname + '/views');
server.register('.html', require('ejs'));

server.use(form());
server.use(express.cookieParser());
server.use(express.session({secret: 'secret'}));
server.use(auth([
    auth.Twitter({
        consumerKey: config.TWITTER_KEY,
        consumerSecret: config.TWITTER_SECRET
    }),
    auth.Facebook({
        appId: config.FACEBOOK_ID,
        appSecret: config.FACEBOOK_SECRET,
        callback: 'http://' + config.MAIN_DOMAIN + '/auth/facebook',
        scope: 'email'
    }),
    auth.Yahoo({
        consumerKey: config.YAHOO_KEY,
        consumerSecret: config.YAHOO_SECRET,
        callback: 'http://' + config.MAIN_DOMAIN + '/auth/yahoo'
    }),
    auth.Google({
        consumerKey: config.GOOGLE_KEY,
        consumerSecret: config.GOOGLE_SECRET,
        callback: 'http://' + config.MAIN_DOMAIN + '/auth/google',
        scope: ""
    })    
]));

server.listen(config.HTTP_PORT, config.HTTP_HOST);

controllers(server);