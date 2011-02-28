var MESSAGES = require('../shared/messages');
var _ = require('../shared/underscore')._;
var flow = require('../shared/flow');
var db = require('./db');

function Handlers(session) {
    this.session = session;
    this.initialized = false;
    this.puzzle = null;
    this.user = null;

    this.session.onMessage(_.bind(function(message) {
        if(!_.isString(message.action)) { return; }
        
        var methodName = message.action + 'Action';
        var handlerExists = _.isFunction(this[methodName]);
        var handlerAvailable = this.initialized || message.action == MESSAGES.initialize;

        if(handlerAvailable && handlerExists) {
            this[methodName].call(this, message.data);
        }
    }, this));

    this.session.onDisconnect(_.bind(function() {
        if(!this.initialized) { return; }

        this.puzzle.disconnectUser(this.user._id);
        this.session.broadcast(MESSAGES.connectedUsersCount, this.puzzle.connected.length);
        this.session.broadcast(MESSAGES.unlockPieces, this.puzzle.unlockAll(this.user._id));
    }, this));
}

Handlers.prototype.initializeAction = function(params) {
    var self = this;
    self.retrieveUser(params.userId, function(user) {
        self.user = user;

        db.Puzzles.last(function(lastPuzzle) {
            self.initialized = true;
            self.puzzle = lastPuzzle;
            self.puzzle.connectUser(user._id);

            self.session.broadcast(MESSAGES.connectedUsersCount,
                                   self.puzzle.connected.length);
            self.userDataAction();
            self.puzzleDataAction();
            self.leadersBoardAction();
        });
    });
};

//TODO: getPuzzleScore method should return value (without callback)
Handlers.prototype.userDataAction = function() {
    this.user.getPuzzleScore(this.puzzle._id, _.bind(function(puzzleScore) {
        var userData = this.user.toObject();
        this.session.send(MESSAGES.userData, {
            id: userData._id,
            name: userData.name,
            score: userData.score,
            puzzleScore: puzzleScore
        });
    }, this));
};

Handlers.prototype.leadersBoardAction = function() {
    this.getLeadersBoardData(_.bind(function(data) {
        this.session.send(MESSAGES.leadersBoard, data);
    }, this));
};

Handlers.prototype.puzzleDataAction = function() {
    this.puzzle.compactInfo(_.bind(function(info) {
        this.session.send(MESSAGES.puzzleData, info);
    }, this));
};

Handlers.prototype.piecesDataAction = function() {
    this.puzzle.compactPieces(_.bind(function(pieces) {
        this.session.send(MESSAGES.piecesData, pieces);
    }, this));
};

Handlers.prototype.setUserNameAction = function(userName) {
    this.user.setName(userName, _.bind(function() {
        this.userDataAction();
        this.leadersBoardAction();
    }, this));
};

Handlers.prototype.selectPieceAction = function(coords) {
    if(this.puzzle.lock(coords[0], coords[1], this.user._id)) {
        this.session.send(MESSAGES.selectPiece, coords);
        this.session.broadcast(MESSAGES.lockPiece, coords);
        this.session.startCountDown(_.bind(function() {
            var coords = this.puzzle.unlockAll(this.user._id);
            this.session.send(MESSAGES.releasePiece, coords[0]);
            this.session.broadcast(MESSAGES.unlockPieces, coords);
        }, this));
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
        self.session.broadcast(MESSAGES.unlockPieces, coords);

        self.puzzle.getPiece(coords[0][0], coords[0][1], function(firstPiece) {
            self.puzzle.getPiece(coords[1][0], coords[1][1], function(secondPiece) {
                var correctSwapsNum = 0;
                if(firstPiece.isCollected()) {correctSwapsNum++;}
                if(secondPiece.isCollected()) {correctSwapsNum++;}
                if(correctSwapsNum > 0) {
                    self.addScore(correctSwapsNum);
                }
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
    var points = 0;

    flow.exec(
        function() {
            self.puzzle.getCompletionPercentage(this);
        },
        function(percentage) {
            points = parseInt((100 - percentage) / 2) * correctSwapsNum;
            self.session.send(MESSAGES.completionPercentage, percentage);
            self.user.linkWith(self.puzzle._id, this);
        },
        function() {
            self.user.addScore(points, this.MULTI());
            self.user.addPuzzleScore(points, self.puzzle._id, this.MULTI());
        },
        function() {
            self.userDataAction();
            self.getLeadersBoardData(function(data) {
                self.session.send(MESSAGES.leadersBoard, data);
                self.session.broadcast(MESSAGES.leadersBoard, data);
            });
        });
};

//TODO: Refactor this when bug in mongoose is fixed
Handlers.prototype.getLeadersBoardData = function(callback) {
    var self = this;
    var result = {};

    flow.exec(
        function() {
            db.Users.allLinkedWith(self.puzzle._id, this);
        },
        function(users) {
            flow.serialForEach(users, function(user) {
                var online = self.puzzle.isConnected(user._id);
                result[user._id] = {name: user.name, online: online};
                user.getPuzzleScore(self.puzzle._id, this);
            }, function(score, userId) {
                result[userId].score = score;
            }, function() {
                callback(_.sortBy(result, function(row) {
                    return row.score;
                }));
            });
        });
};

module.exports = Handlers;