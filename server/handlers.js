var MESSAGES = require('../shared/messages');
var _ = require('../shared/underscore')._;
var flow = require('../shared/flow');
var db = require('./db');

function Handlers(session) {
    this.session = session;
    this.initialized = false;
    this.selected = false;
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

            self.session.send(MESSAGES.initialized);
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
    this.user.getPuzzleData(this.puzzle._id, _.bind(function(puzzleData) {
        var userData = this.user.toObject();
        this.session.send(MESSAGES.userData, {
            id: userData._id,
            name: userData.name,
            score: puzzleData.score,
            swaps: puzzleData.swaps,
            found: puzzleData.found
        });
    }, this));
};

Handlers.prototype.leadersBoardAction = function() {
    this.getLeadersBoardData(_.bind(function(data) {
        this.session.send(MESSAGES.leadersBoard, data);
    }, this));
};

Handlers.prototype.topTwentyAction = function() {
    this.getTopTwentyData(_.bind(function(data) {
        this.session.send(MESSAGES.topTwenty, data);
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
    if (this.selected) { return; }

    this.puzzle.getPiece(coords[0], coords[1], _.bind(function(piece) {
        if(!piece.isCollected() && !piece.isLocked()) {
            piece.lock(this.user._id);

            this.selected = true;
            this.session.send(MESSAGES.selectPiece, coords);
            this.session.broadcast(MESSAGES.lockPiece, coords);
            this.session.startCountDown(_.bind(function() {
                var coords = this.puzzle.unlockAll(this.user._id);
                this.session.send(MESSAGES.releasePiece, coords[0]);
                this.session.broadcast(MESSAGES.unlockPieces, coords);
                this.selected = false;
            }, this));
        }
    }, this));
};

Handlers.prototype.releasePieceAction = function(coords) {
    if(this.puzzle.unlock(coords[0], coords[1], this.user._id)) {
        this.session.send(MESSAGES.releasePiece, coords);
        this.session.broadcast(MESSAGES.unlockPieces, [coords]);
        this.session.stopCountDown();
        this.selected = false;
    }
};

Handlers.prototype.swapPiecesAction = function(coords) {
    var self = this;
    self.puzzle.swap(coords[0][0], coords[0][1], coords[1][0], coords[1][1], self.user._id, function(swaped) {
        if(!swaped) {return;} 

        self.selected = false;
        self.session.stopCountDown();
        self.session.send(MESSAGES.swapPieces, coords);
        self.session.broadcast(MESSAGES.swapPieces, coords);
        self.session.broadcast(MESSAGES.unlockPieces, coords);

        self.puzzle.addSwap(function() {
            self.session.send(MESSAGES.swapsCount, self.puzzle.swapsCount);
            self.session.broadcast(MESSAGES.swapsCount, self.puzzle.swapsCount);
        });
        
        flow.exec(
            function() {
                self.user.addSwap(self.puzzle._id, this);
            },
            function() {
                var foundNumber = 0;
                flow.serialForEach(coords, function(coord) {
                    self.puzzle.getPiece(coord[0], coord[1], this);
                }, function(piece) {
                    if(piece.isCollected()) { foundNumber++; }
                }, function() {
                    if(foundNumber > 0) { self.addScore(foundNumber); }
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

Handlers.prototype.addScore = function(foundNumber) {
    var self = this;
    var points = 0;

    flow.exec(
        function() {
            self.puzzle.getCompletionPercentage(this);
        },
        function(percentage) {
            points = parseInt((100 - percentage) / 2) * foundNumber;
            self.session.send(MESSAGES.completionPercentage, percentage);
            self.session.broadcast(MESSAGES.completionPercentage, percentage);
            
            self.user.addScore(points, this.MULTI());
            self.user.addPuzzleScore(points, self.puzzle._id, this.MULTI());
            self.user.addFoundPieces(foundNumber, self.puzzle._id, this.MULTI());
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
                user.getPuzzleData(self.puzzle._id, this);
            }, function(puzzleData, userId) {
                result[userId].score = puzzleData.score;
                result[userId].swaps = puzzleData.swaps;
                result[userId].found = puzzleData.found;
            }, function() {
                callback(result);
            });
        });
};

//TODO: Refactor this when bug in mongoose is fixed
Handlers.prototype.getTopTwentyData = function(callback) {
    flow.exec(
        function() {
            db.Users.all(this);
        },
        function(users) {
            var result = _.map(users, function(user) {
                return {
                    name: user.name,
                    score: user.score,
                    created: user.created.getTime()
                };
            });
            callback(result.slice(0, 20));
        });
};

module.exports = Handlers;