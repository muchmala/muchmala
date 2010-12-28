var http = require('http');
var io = require('socket.io');

var config = require('./config');
var db = require('./db');
var models = require('./models');
var handlers = require('./handlers').handlers;

var server = http.createServer();
server.listen(config.server.port, config.server.host);

db.createConnection(function(client) {
    db.useCollection('maps', function(error, mapsCollection) {
        db.useCollection('users', function(error, usersCollection) {

            var maps = models.maps.load(mapsCollection);
            var users = models.users.load(usersCollection);
            var socket = io.listen(server);

            socket.on('connection', function(client) {
                handlers(client, maps, users);
            });
        });
    });
});
