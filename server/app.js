var config = require('./config');
var db = require('./db');
var http = require('http');
var io = require('socket.io');

var models = require('./models');
var handlers = require('./handlers').handlers;

var server = http.createServer();
server.listen(config.server.port, config.server.host);

db.createConnection(function(client) {
    db.useCollection('maps', function(error, mapsCollection) {
        var mapsLoader = models.MapsLoader(mapsCollection);
        mapsLoader.getLastMap(function(map) {
            var socket = io.listen(server);

            socket.on('connection', function(client) {
                handlers(client, map);
            });
        });
    });
});
