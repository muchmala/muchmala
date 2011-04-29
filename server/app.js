var db = require('./db');
var fs = require('fs');
var io = require('socket.io');
var config = require('../config');
var express = require('express');
var _ = require('../shared/underscore')._;

var Games = require('./games');
var Client = require('./client');

var server = express.createServer();

server.register('.html', require('ejs'));
server.set('views', __dirname + '/views');
server.set('view engine', 'html');

var viewOptions = {
    config: {
        production: !config.DEV,
        IO_HOST: config.IO_HOST,
        IO_PORT: config.IO_PORT,
        STATIC_HOST: config.STATIC_HOST + (config.STATIC_PORT != 80 ? ':' + config.STATIC_PORT : ''),
		version: fs.readFileSync(__dirname + '/../static_version', 'utf8')
    }
};

server.get('/', function(req, res) {
    res.render('puzzle', viewOptions);
});

server.listen(config.HTTP_PORT, config.HTTP_HOST);

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
