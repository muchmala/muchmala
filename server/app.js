var config = require('./config');
var db = require('./db');
var http = require('http');
var io = require('../../socket.io');

console.log(require.paths);

var models = require('./models');
var handlers = require('./handlers').handlers;

var server = http.createServer();
server.listen(config.server.port, config.server.host);

db.createConnection(function() {
    models.Maps.generate(1440, 758, 90, function(map) {
        var socket = io.listen(server);

        socket.on('connection', function(client) {
            handlers(client, map.data);
        });
    });
})
