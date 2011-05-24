var ioCluster = require('socket.io-cluster');
var config = require('../../config');
var http = require('http');
var opts = require('opts');

opts.parse([
    {
        'short': 'p',
        'long': 'port',
        'description': 'HTTP port',
        'value': true,
        'required': false
    }
], true);

var server = http.createServer();
var ioNode = ioCluster.makeIoListener(server, config);
var port = opts.get('port') || config.HTTP_PORT;

server.listen(port, config.HTTP_HOST);

ioNode.getClientInfo = function(client) {
    return {
        sessionId: client.sessionId,
        puzzleId: Object.keys(client.channels)[0],
        userId: client.userId
    };
};

ioNode.server.on('app setUserId', function(message) {
    var client = ioNode.socketIo.clients[message.recipients[0].id];
    if (client !== undefined) {
        client.userId = message.data.userId;
    }
});
