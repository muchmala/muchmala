var http = require('http');
var io = require('socket.io');

var db = require('./db');
var config = require('./config');
var handlers = require('./handlers').handlers;

var server = http.createServer();
server.listen(config.server.port, config.server.host);

db.connect(function() {
    var socket = io.listen(server);
    socket.on('connection', function(client) {
        handlers(client);
    });
});
