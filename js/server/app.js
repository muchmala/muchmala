var config = require('./config');
var http = require('http');
var io = require('socket.io');

var puzzle = {
    controller: require('./controller').controller,
    maps:       require('./maps')
};

var server = http.createServer();
server.listen(config.server.port, config.server.host);

var map = puzzle.maps.generate(1440, 758, 90);

var socket = io.listen(server);
socket.on('connection', function(client) {
    puzzle.controller(client, map);
});