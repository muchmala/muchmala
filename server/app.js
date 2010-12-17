var config = require('./config');
var db = require('./db');
var http = require('http');
var io = require('socket.io');

var puzzle = {
    handlers: require('./handlers').getHandlers,
    maps:     require('./maps')
};

var server = http.createServer();
server.listen(config.server.port, config.server.host);

var map = puzzle.maps.generate(1440, 758, 90);

db.createConnection(function() {
    var socket = io.listen(server);
    socket.on('connection', function(client) {
        puzzle.handlers(client, map);
    });
})
