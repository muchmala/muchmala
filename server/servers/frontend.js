var express = require('express');
var auth = require('connect-auth');
var form = require('connect-form');
var opts = require('opts');

var db = require('../db');
var controllers = require('../controllers');

var config = require('../../config');

var server = express.createServer();

opts.parse([
{
    'short': 'p',
    'long': 'port',
    'description': 'HTTP port',
    'value': true,
    'required': false
}
], true);

var port = opts.get('port') || config.HTTP_PORT;

db.connect(function() {});

server.set('view engine', 'html');
server.set('views', __dirname + '/../views');
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
        callback: config.MAIN_URL + '/auth/facebook',
        scope: 'email'
    }),
    auth.Yahoo({
        consumerKey: config.YAHOO_KEY,
        consumerSecret: config.YAHOO_SECRET,
        callback: config.MAIN_URL + '/auth/yahoo'
    }),
    auth.Google({
        consumerKey: config.GOOGLE_KEY,
        consumerSecret: config.GOOGLE_SECRET,
        callback: config.MAIN_URL + '/auth/google',
        scope: ""
    })    
]));

server.listen(port, config.HTTP_HOST);

controllers(server);