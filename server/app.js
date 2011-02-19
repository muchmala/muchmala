var http = require('http');
var io = require('socket.io');

var config = require('./config');
var db = require('./db');
var models = require('./models');
var handlers = require('./handlers').handlers;

var server = http.createServer();
server.listen(config.server.port, config.server.host);

db.createConnection(function(client) {
    db.useCollection('puzzles', function(error, puzzlesCollection) {
        db.useCollection('pieces', function(error, piecesCollection) {
            db.useCollection('users', function(error, usersCollection) {
                
                var socket = io.listen(server);
                var users = models.users.load(usersCollection);
                var puzzles = models.maps.load(puzzlesCollection, piecesCollection);

                socket.on('connection', function(client) {
                    handlers(client, puzzles, users);
                });
            });
        });
    });
});
