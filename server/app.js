var db = require('./db');
var io = require('socket.io');
var config = require('../config');
var express = require('express');

var Handlers = require('./handlers');
var Session = require('./session');

var server = express.createServer();

server.register('.html', require('ejs'));
server.set('views', __dirname + '/views');
server.set('view engine', 'html');

var viewOptions = {
    config: {
        production: !config.DEV,
        static: config.STATIC_HOST + (config.STATIC_PORT != 80 ? ':' + config.STATIC_PORT : '')
    }
};

server.get('/', function(req, res) {
    res.render('puzzle', viewOptions);
});

server.listen(config.HTTP_PORT, config.HTTP_HOST);

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
