var db = require('./db');
var io = require('socket.io');
var config = require('./config');
var express = require('express');

var Handlers = require('./handlers');
var Session = require('./session');

var server = express.createServer();
var httpProxy = require('http-proxy');
var proxy = new httpProxy.HttpProxy();

server.register('.html', require('ejs'));
server.set('views', __dirname + '/views');
server.set('view engine', 'html');

server.get('/', function(req, res) {
    res.render('puzzle', {config: {production: config.production}});
});

function proxyToNginx(req, res) {
	proxy.proxyRequest(req, res, {host: 'localhost', port: 9000});
};

server.get('/shared/*', proxyToNginx);
server.get('/img/*', proxyToNginx);
server.get('/css/*', proxyToNginx);
server.get('/js/*', proxyToNginx);

server.listen(config.server.port, config.server.host);

db.connect(function() {
    var socket = io.listen(server);
    socket.on('connection', function(client) {
        var session = new Session(client);
        var handlers = new Handlers(session);

        session.onDisconnect(function() {
            handlers.disconnect();
            delete handlers;
            delete session;
        });
    });
});