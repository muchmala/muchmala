var MESSAGES = require('../shared/messages');
var channels = require('./channels');
var _ = require('../shared/underscore')._;
var flow = require('../shared/flow');
var db = require('./db');

function Handlers(session) {
    this.session = session;
    this.channel = null;
    this.initialized = false;
    this.selected = false;
    this.puzzle = null;
    this.user = null;

    this.session.onMessage(_.bind(function(message) {
        if(!_.isString(message.action)) {return;}
        
        var methodName = message.action + 'Action';
        var handlerExists = _.isFunction(this[methodName]);
        var handlerAvailable = this.initialized || message.action == MESSAGES.initialize;

        if(handlerAvailable && handlerExists) {
            this[methodName].call(this, message.data);
        }
    }, this));
}

Handlers.prototype.initializeAction = function(params) {
    var self = this;
    self.retrieveUser(params.userId, function(user) {
        self.retrievePuzzle(params.puzzleId, function(puzzle) {
            self.initialize(user, puzzle);
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
    if (this.selected) {return;}

    this.puzzle.getPiece(coords[0], coords[1], _.bind(function(piece) {
        if(!piece.isCollected() && !piece.isLocked()) {
            piece.lock(this.user._id);

            this.selected = true;
            this.session.send(MESSAGES.selectPiece, coords);
            this.channel.broadcast(MESSAGES.lockPiece, coords, [this.session]);
            this.session.startCountDown(_.bind(function() {
                var coords = this.puzzle.unlockAll(this.user._id);
                this.session.send(MESSAGES.releasePiece, coords[0]);
                this.channel.broadcast(MESSAGES.unlockPieces, coords, [this.session]);
                this.selected = false;
            }, this));
        }
    }, this));
};

Handlers.prototype.releasePieceAction = function(coords) {
    if(this.puzzle.unlock(coords[0], coords[1], this.user._id)) {
        this.session.send(MESSAGES.releasePiece, coords);
        this.channel.broadcast(MESSAGES.unlockPieces, [coords], [this.session]);
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
        
        self.channel.broadcast(MESSAGES.swapPieces, coords);
        self.channel.broadcast(MESSAGES.unlockPieces, coords, [self.session]);

        self.user.addSwap(self.puzzle._id);
        
        self.puzzle.addSwap(function() {
            self.channel.broadcast(MESSAGES.swapsCount, self.puzzle.swapsCount);
        });
        
        if(swaped.found > 0) {
            self.addScore(swaped.found, swaped.completion);
        }
    });
};

Handlers.prototype.initialize = function(user, puzzle) {
    this.initialized = true;

    this.user = user;
    this.puzzle = puzzle;

    this.channel = channels.get(puzzle._id);
    this.channel.add(this.session);
    this.session.userId = user._id;

    this.session.send(MESSAGES.initialized);
    this.channel.broadcast(MESSAGES.connectedUsersCount, this.channel.length());

    this.userDataAction();
    this.puzzleDataAction();
    this.leadersBoardAction();
};

Handlers.prototype.disconnect = function() {
    if(!this.initialized) {return;}

    this.channel.remove(this.session);
    this.channel.broadcast(MESSAGES.connectedUsersCount, this.channel.length());
    this.channel.broadcast(MESSAGES.unlockPieces, this.puzzle.unlockAll(this.user._id));
};

Handlers.prototype.retrieveUser = function(userId, callback) {
    if (userId == null) {
        db.Users.add('anonymous', function(anonymous) {
            callback(anonymous);
        });
        return;
    }
    db.Users.get(userId, function(user) {
        if (user) {
            callback(user);
            return;
        }
        db.Users.add('anonymous', function(anonymous) {
            callback(anonymous);
        });
    });
};

Handlers.prototype.retrievePuzzle = function(puzzleId, callback) {
    if (puzzleId == null) {
        db.Puzzles.last(function(puzzle) {
            callback(puzzle);
        });
        return;
    }
    db.Puzzles.get(puzzleId, function(puzzle) {
        if (puzzle) {
            callback(puzzle);
            return;
        }
        db.Puzzles.last(function(puzzle) {
            callback(puzzle);
        });
    });
};

Handlers.prototype.addScore = function(found, completion) {
    var self = this;
    var points = Math.floor((100 - completion) / 2) * found;
    self.channel.broadcast(MESSAGES.completionPercentage, completion);

    flow.exec(
        function() {
            self.user.addScore(points, this.MULTI());
            self.user.addPuzzleScore(points, self.puzzle._id, this.MULTI());
            self.user.addFoundPieces(found, self.puzzle._id, this.MULTI());
        },
        function() {
            self.userDataAction();
            self.getLeadersBoardData(function(data) {
                self.channel.broadcast(MESSAGES.leadersBoard, data);
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
                var online = self.channel.includesUser(user._id);
                result[user._id] = {name: user.name, online: online};
                user.getPuzzleData(self.puzzle._id, this);
            }, function(puzzleData, userId) {
                result[userId].score = puzzleData.score;
                result[userId].swaps = puzzleData.swaps;
                result[userId].found = puzzleData.found;
            }, function() {
                callback(_.select(result, function(user) {
                    return user.score && user.found;
                }));
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