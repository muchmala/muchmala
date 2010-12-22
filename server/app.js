var config = require('./config');
var db = require('./db');
var http = require('http');
var io = require('socket.io');

var models = require('./models');
var handlers = require('./handlers').getHandlers;

var server = http.createServer();
server.listen(config.server.port, config.server.host);

db.createConnection(function() {
    var map = models.Maps.create(800, 600, 90);
    var socket = io.listen(server);

    socket.on('connection', function(client) {
        handlers(client, map);
    });
})
