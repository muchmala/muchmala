(function() {

function Server() {
    Server.superproto.constructor.call(this);
        
    this.socket = new io.Socket(null, {
        transports: ['websocket', 'flashsocket', 'xhr-multipart', 'xhr-polling'],
        rememberTransport: false
    });
    
    this.socket.on('message', _.bind(function(data) {
        var parsed = JSON.parse(data);
        this.fire(parsed.event, parsed.data);
        log('Received: ' + parsed.event);
    }, this));
    
    this.socket.on('disconnect', _.bind(function() {
        log('Disconnected');
    }, this));
    
    this.socket.on('connect', _.bind(function() {
        this.fire('connected');
        log('Connected');
    }, this));
}

Puzz.Utils.inherit(Server, Puzz.Observer);

Server.prototype.sendMessage = function(message) {
    if(this.socket.connected) {
        this.socket.send(message);
        log('sent ' + message);
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

window.Puzz.Server = Server;

})();