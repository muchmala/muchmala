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