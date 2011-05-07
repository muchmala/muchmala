var db = require('./db');
var io = require('socket.io-cluster');
var _ = require('../shared/underscore')._;

var Games = require('./games');
var Client = require('./client');

var config = require('../config');

db.connect(function() {
    var games = new Games(db);
    var socket = io.getClient(config);

    socket.on('no-client', makeJob);
    socket.on('connection', makeJob);

    function makeJob(client) {
        console.log(client);
        client.on('message', function(message) {
            console.log(message);
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
    }
});
