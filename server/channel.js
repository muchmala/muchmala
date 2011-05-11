var _ = require('../shared/underscore')._;
var MESSAGES = require('../shared/messages');
var util = require('util');

function Channel(channel) {
    this.listener = undefined;
    this.channelId = channel._id;
    this.clientsCount = 0;
}

Channel.prototype.add = function(client) {
    if (this.listener === undefined) {
        this.listener = client.client.listener;
    }

    ++this.clientsCount;
    client.subscribeToChannel(this.channelId);
};

Channel.prototype.remove = function(client) {
    --this.clientsCount;
    client.unsubscribeFromChannel(this.channelId);
};

Channel.prototype.broadcast = function(event, data, except) {
    if (this.listener === undefined) {
        console.log('No listeners in channel %s', this.channelId);
    }

    this.listener.broadcastToChannel(this.channelId, MESSAGES.create(event, data), except);
};

Channel.prototype.length = function() {
    return this.clientsCount;
};

module.exports = Channel;