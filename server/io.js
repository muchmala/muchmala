var fs = require('fs');
var iocluster = require('socket.io-cluster');
var express = require('express');
var _ = require('../shared/underscore')._;

var config = require('../config');
var server = require('./server');
var ioNode = iocluster.listen(server, config);

ioNode.on('sync', function(client) {
    ioNode.sendMessage('sync', client, JSON.stringify({userId: client.userId, puzzleId: client.channels[0]}));
});
ioNode.on('setUserId', function(client, userId) {
    client.userId = userId;
});