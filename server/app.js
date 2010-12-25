var config = require('./config');
var db = require('./db');
var http = require('http');
var io = require('socket.io');

var models = require('./models');
var handlers = require('./handlers').handlers;

var server = http.createServer();
server.listen(config.server.port, config.server.host);

db.createConnection(function() {
    var maps = models.maps.load('collection');
    var users = models.users.load('collection');
    var socket = io.listen(server);

    socket.on('connection', function(client) {
        handlers(client, maps, users);
    });
});
