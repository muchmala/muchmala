(function() {

function Server() {
    this.socket = new io.Socket(window.IO_HOST, {
        port: window.IO_PORT,
        transports: ['websocket', 'flashsocket', 'xhr-multipart', 'xhr-polling'],
        rememberTransport: false
    });
    
    var self = this;
    
    this.socket.on('message', function(data) {
        var parsed = JSON.parse(data);
        self.trigger(parsed.event, parsed.data);
        log('Received: ' + parsed.event);
    });
    
    this.socket.on('disconnect', function() {
        log('Disconnected');
    });
    
    this.socket.on('connect', function() {
        self.trigger('connected');
        log('Connected');
    });
}

_.extend(Server.prototype, Backbone.Events);

var Proto = Server.prototype;

Proto.sendMessage = function(message) {
    if(this.socket.connected) {
        this.socket.send(message);
        log('sent ' + message);
    }
};

Proto.createMessage = function(action, data) {
    return JSON.stringify({action: action, data: data});
};

Proto.connect = function() {
    this.socket.connect();
};

Proto.disconnect = function() {
    this.socket.disconnect();
};

Proto.reconnect = function() {
    this.socket.disconnect();
    setTimeout(_.bind(function() {
        this.socket.connect();
    }, this), 500);
};

Proto.initialize = function(anonymousId, sessionId, puzzleId) {
    var data = {};
    if (!_.isNull(anonymousId)) { data.anonymousId = anonymousId; }
    if (!_.isNull(sessionId)) { data.sessionId = sessionId; }
    if (!_.isNull(puzzleId)) { data.puzzleId = puzzleId; }

    this.sendMessage(this.createMessage(MESSAGES.initialize, data));
};

Proto.getPiecesData = function(puzzleId) {
    this.sendMessage(this.createMessage(MESSAGES.piecesData, puzzleId));
};

Proto.getUserData = function(userId) {
    this.sendMessage(this.createMessage(MESSAGES.userData, userId));
};

Proto.setUserName = function(userName) {
    this.sendMessage(this.createMessage(MESSAGES.setUserName, userName));
};

Proto.lockPiece = function(x, y) {
    this.sendMessage(this.createMessage(MESSAGES.lockPiece, [x, y]));
};

Proto.unlockPiece = function(x, y) {
    this.sendMessage(this.createMessage(MESSAGES.unlockPiece, [x, y]));
};

Proto.swapPieces = function(x1, y1, x2, y2) {
    this.sendMessage(this.createMessage(MESSAGES.swapPieces, [[x1, y1], [x2, y2]]));
};

Proto.getTopTwenty = function() {
    this.sendMessage(this.createMessage(MESSAGES.topTwenty));
};

window.Puzz.Server = Server;

})();