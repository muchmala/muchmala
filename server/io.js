var ioCluster = require('socket.io-cluster'),
    server = require('./server'),
    config = require('../config');

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
