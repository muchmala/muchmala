var express = require('express'),
    auth = require('connect-auth'),
    form = require('connect-form'),
    opts = require('opts'),

    db = require('./db'),
    controllers = require('./controllers'),

    config = require('../config');

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

server.listen(port, config.HTTP_HOST);

controllers(server);