var MESSAGES = require('../shared/messages');
var _ = require('../shared/underscore')._;
var flow = require('../shared/flow');
var db = require('./db');

function Handlers(session) {
    this.session = session;
    this.initialized = false;
    this.puzzle = null;
    this.user = null;

    var self = this;
    this.session.onMessage(function(message) {
        if(!_.isString(message.action)) { return; }
        
        var methodName = message.action + 'Action';
        var handlerExists = _.isFunction(self[methodName]);
        var handlerAvailable = self.initialized || message.action == MESSAGES.initialize;

        if(handlerAvailable && handlerExists) {
            self[methodName].call(self, message.data);
        }
    });

    this.session.onDisconnect(function() {
        if(!self.intialized) { return; }

        self.puzzle.disconnectUser(self.user._id, function() {
            self.session.broadcast(MESSAGES.connectedUsersCount, self.puzzle.connected.length);
        });
        self.puzzle.unlockAll(self.user._id, function(pieces) {
            self.session.broadcast(MESSAGES.unlockPieces, pieces);
        });
    });
}

Handlers.prototype.initializeAction = function(params) {
    var self = this;
    self.retrieveUser(params.userId, function(user) {
        self.user = user;

        db.Puzzles.last(function(lastPuzzle) {
            self.initialized = true;
            self.puzzle = lastPuzzle;
            self.puzzle.connectUser(user._id);

            self.session.broadcast(MESSAGES.connectedUsersCount, self.puzzle.connected.length);

            self.userDataAction();
            self.puzzleDataAction();
        });
    });
};

Handlers.prototype.userDataAction = function() {
    var self = this;
    //TODO: getPuzzleScore method should return value (without callback)
    self.user.getPuzzleScore(self.puzzle._id, function(puzzleScore) {
        var userData = self.user.toObject();
        self.session.send(MESSAGES.userData, {
            id: userData._id,
            name: userData.name,
            score: userData.score,
            puzzleScore: puzzleScore
        });
    });
};

Handlers.prototype.puzzleDataAction = function() {
    var self = this;
    self.puzzle.compact(function(compact) {
        self.session.send(MESSAGES.puzzleData, compact);
    });
};

Handlers.prototype.setUserNameAction = function(userName) {
    var self = this;
    self.user.setName(userName, function() {
        self.userData();
    });
};

Handlers.prototype.selectPieceAction = function(coords) {
    var self = this;
    if(this.puzzle.lock(coords[0], coords[1], this.user._id)) {
        this.session.send(MESSAGES.selectPiece, coords);
        this.session.broadcast(MESSAGES.lockPiece, coords);
        this.session.startCountDown(function() {
            self.puzzle.unlockAll(self.user._id, function(pices) {
                self.session.send(MESSAGES.unlockPieces, pices);
                self.session.broadcast(MESSAGES.unlockPieces, pices);
            });
        });
    }
};

Handlers.prototype.releasePieceAction = function(coords) {
    if(this.puzzle.unlock(coords[0], coords[1], this.user._id)) {
        this.session.send(MESSAGES.releasePiece, coords);
        this.session.broadcast(MESSAGES.unlockPieces, [coords]);
        this.session.stopCountDown();
    }
};

Handlers.prototype.swapPiecesAction = function(coords) {
    var self = this;
    self.puzzle.swap(coords[0][0], coords[0][1], coords[1][0], coords[1][1], self.user._id, function(swaped) {
        if(!swaped) {return;}

        self.session.stopCountDown();
        self.session.send(MESSAGES.swapPieces, coords);
        self.session.broadcast(MESSAGES.swapPieces, coords);

        self.puzzle.getPiece(coords[0][0], coords[0][1], function(firstPiece) {
            self.puzzle.getPiece(coords[1][0], coords[1][1], function(secondPiece) {
                var correctSwapsNum = 0;
                if(firstPiece.isCollected()) {correctSwapsNum++;}
                if(secondPiece.isCollected()) {correctSwapsNum++;}
                self.addScore(correctSwapsNum);
            });
        });
    });
};

Handlers.prototype.retrieveUser = function(userId, callback) {
    if(userId == null) {
        db.Users.add('anonymous', function(anonymous) {
            callback(anonymous);
        });
        return;
    }
    db.Users.get(userId, function(found) {
        if(found) {
            callback(found);
            return;
        }
        db.Users.add('anonymous', function(anonymous) {
            callback(anonymous);
        });
    });
};

Handlers.prototype.addScore = function(correctSwapsNum) {
    var self = this;
    self.puzzle.getCompletionPercentage(function(percentage) {
        self.user.isLinkedWith(self.puzzle._id, function(linked) {
            if(!linked) {
                self.user.linkWith(self.puzzle._id);
            }
        });

        var points = parseInt((100 - percentage) / 2) * correctSwapsNum;
        self.user.addScore(self.puzzle._id, points, this);

        self.Handlers.userData();
        self.send(MESSAGES.completionPercentage, percentage);
    });
};

module.exports = Handlers;