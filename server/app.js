var config = require('./config');
var db = require('./db');
var http = require('http');
var io = require('socket.io');

var models = require('./models');
var handlers = require('./handlers').handlers;

var server = http.createServer();
server.listen(config.server.port, config.server.host);

db.createConnection(function() {
    var mapsLoader = models.MapsLoader('collection');
    mapsLoader.getMap(1, function(map) {
        var socket = io.listen(server);

        socket.on('connection', function(client) {
            handlers(client, map);
        });
    });
});
