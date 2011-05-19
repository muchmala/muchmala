var MESSAGES = require('../shared/messages');

function Client(client) {
    this.client = client;
    this.countDown = null;
    this.countDownDelay = 20000;
}

Client.prototype.startCountDown = function(callback) {
    var self = this;
    self.countDown = setTimeout(function() {
        callback();
    }, self.countDownDelay);
};

Client.prototype.stopCountDown = function() {
    clearTimeout(this.countDown);
};

Client.prototype.setUserId = function(userId) {
    if (userId != null) {
        this.client.listener.server
            .createMessage({userId: userId})
            .setType('setUserId')
            .forClient(this.client.sessionId)
            .send();
    }
};

Client.prototype.subscribeToChannel = function(channel) {
    this.client.subscribeToChannel(channel);
};

Client.prototype.unsubscribeFromChannel = function(channel) {
    this.client.unsubscribeFromChannel(channel);
};

Client.prototype.send = function(event, data) {
    this.client.send(MESSAGES.create(event, data));
};

Client.prototype.broadcast = function(event, data) {
    this.client.broadcast(MESSAGES.create(event, data));
};

Client.prototype.onMessage = function(callback) {
    this.client.on('message', function(message) {
        callback(JSON.parse(message));
    });
};

Client.prototype.onDisconnect = function(callback) {
    this.client.on('disconnect', function() {
        callback();
    });
};

module.exports = Client;