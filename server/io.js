var ioCluster = require('socket.io-cluster'),
    http = require('http'),
    opts = require('opts'),
    config = require('../config');

opts.parse([
    {
        'short': 'p',
        'long': 'port',
        'description': 'HTTP port',
        'value': true,
        'required': false
    }
], true);

var port = opts.get('port') || config.HTTP_PORT;

var server = http.createServer();
    server.listen(port);
var ioNode = ioCluster.makeIoListener(server, config);

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
