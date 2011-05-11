var db = require('./db');
var io = require('socket.io');
var _ = require('../shared/underscore')._;
var server = require('./server');

var Games = require('./games');
var Client = require('./client');

db.connect(function() {
    var games = new Games(db);
    var socket = io.listen(server);

    socket.on('connection', function(client) {
        client.on('message', function(message) {
            message = JSON.parse(message);

            if (!_.isUndefined(message.action) && message.action == 'initialize') {
                var puzzleId = null, userId = null;
                if (!_.isUndefined(message.data)) {
                    puzzleId = message.data.puzzleId || null;
                    userId = message.data.userId || null;
                }
                games.addPlayer(new Client(client), userId, puzzleId);
            }
        });
    });
});
