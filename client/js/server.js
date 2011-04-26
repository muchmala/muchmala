window.Puzz = (function(ns) {

function Server() {
    this.observer = ns.Utils.Observer();
    this.socket = new io.Socket(null, {
        transports: ['websocket', 'flashsocket', 'xhr-multipart', 'xhr-polling'],
        rememberTransport: false
    });
    
    var self = this;
    
    this.socket.on('message', function(data) {
        var parsed = JSON.parse(data);
        self.observer.fire(parsed.event, parsed.data);
        log('Received: ' + parsed.event);
    });
    this.socket.on('disconnect', function() {
        log('Disconnected');
        self.connect();
    });
    this.socket.on('connect', function() {
        self.observer.fire('connected');
        log('Connected');
    });

    this.on = this.observer.on;
    this.once = this.observer.once;
}

Server.prototype.sendMessage = function(message) {
    if(this.socket.connected) {
        log('sent ' + message);
        this.socket.send(message);
    }
};

Server.prototype.createMessage = function(action, data) {
    return JSON.stringify({action: action, data: data});
};

Server.prototype.connect = function() {
    this.socket.connect();
};

Server.prototype.disconnect = function() {
    this.socket.disconnect();
};

Server.prototype.initialize = function(userId, puzzleId) {
    var data = {};
    if (!_.isNull(userId)) { data.userId = userId; }
    if (!_.isNull(puzzleId)) { data.puzzleId = puzzleId; }

    this.sendMessage(this.createMessage(MESSAGES.initialize, data));
};

Server.prototype.getPiecesData = function(puzzleId) {
    this.sendMessage(this.createMessage(MESSAGES.piecesData, puzzleId));
};

Server.prototype.getUserData = function(userId) {
    this.sendMessage(this.createMessage(MESSAGES.userData, userId));
};

Server.prototype.setUserName = function(userName) {
    this.sendMessage(this.createMessage(MESSAGES.setUserName, userName));
};

Server.prototype.lockPiece = function(x, y) {
    this.sendMessage(this.createMessage(MESSAGES.lockPiece, [x, y]));
};

Server.prototype.unlockPiece = function(x, y) {
    this.sendMessage(this.createMessage(MESSAGES.unlockPiece, [x, y]));
};

Server.prototype.swapPieces = function(x1, y1, x2, y2) {
    this.sendMessage(this.createMessage(MESSAGES.swapPieces, [[x1, y1], [x2, y2]]));
};

Server.prototype.getTopTwenty = function() {
    this.sendMessage(this.createMessage(MESSAGES.topTwenty));
};

return ns.Server = Server, ns;

})(window.Puzz || {});