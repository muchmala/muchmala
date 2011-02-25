var MESSAGES = require('../shared/messages');

function Session(client) {
    this.client = client;
    this.countDown = null;
    this.countDownDelay = 20000;
}

Session.prototype.startCountDown = function(callback) {
    var self = this;
    self.countDown = setTimeout(function() {
        callback();
    }, self.countDownDelay);
};

Session.prototype.stopCountDown = function() {
    clearTimeout(this.countDown);
};

Session.prototype.send = function(event, data) {
    this.client.send(MESSAGES.create(event, data));
};

Session.prototype.broadcast = function(event, data) {
    this.client.broadcast(MESSAGES.create(event, data));
};

Session.prototype.onMessage = function(callback) {
    this.client.on('message', function(message) {
        callback(JSON.parse(message));
    });
};

Session.prototype.onDisconnect = function(callback) {
    this.client.on('disconnect', function() {
        callback();
    });
};

module.exports = Session;