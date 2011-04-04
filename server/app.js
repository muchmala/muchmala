var db = require('./db');
var io = require('socket.io');
var config = require('./config');
var express = require('express');

var Handlers = require('./handlers');
var Session = require('./session');

var server = express.createServer();

server.register('.html', require('ejs'));
server.set('views', __dirname + '/views');
server.set('view engine', 'html');
server.use(express.static(__dirname + '/../client'));
server.use(express.static(__dirname + '/../shared'));

server.get('/', function(req, res) {
    res.render('puzzle', {config: {production: config.production}});
});

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