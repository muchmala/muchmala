var db = require('./db');
var io = require('socket.io-cluster');
var _ = require('../shared/underscore')._;

var Games = require('./games');
var Client = require('./client');

var config = require('../config');

db.connect(function(err) {
    if (err) {
        throw err;
    }

    var games = new Games(db);
    var socket = io.getClient(config);

    socket.on('no-client', function(client) {
        client.exec('sync');
        client.on('sync', function(data) {
            addPlayer(client, JSON.parse(data));
        });
    });

    socket.on('connection', function(client) {
        client.on('message', function(message) {
            message = JSON.parse(message);

            if (!_.isUndefined(message.action) && message.action == 'initialize') {
                addPlayer(client, message.data);
            }
        });
    });

    function addPlayer(client, data) {
        var puzzleId = null, userId = null;

        if (!_.isUndefined(data)) {
            puzzleId = data.puzzleId || null;
            userId = data.userId || null;
        }

        games.addPlayer(new Client(client), userId, puzzleId);
    }
});
