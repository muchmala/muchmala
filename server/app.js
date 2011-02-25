var db = require('./db'),
    http = require('http'),
    io = require('socket.io'),
    config = require('./config'),
    Handlers = require('./handlers'),
    Session = require('./session');

var server = http.createServer();
server.listen(config.server.port, config.server.host);

db.connect(function() {
    var socket = io.listen(server);
    socket.on('connection', function(client) {
        new Handlers(new Session(client));
    });
});
