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
        this.channel.broadcast(MESSAGES.leadersBoard, data);
    }, this));
};

Handlers.prototype.topTwentyAction = function() {
    this.getTopTwentyData(_.bind(function(data) {
        this.session.send(MESSAGES.topTwenty, data);
    }, this));
};

Handlers.prototype.puzzleDataAction = function() {
    this.getPuzzleData(_.bind(function(data) {
        this.session.send(MESSAGES.puzzleData, data);
    }, this));
};

Handlers.prototype.piecesDataAction = function() {
    this.puzzle.compactPieces(_.bind(function(pieces) {
        this.session.send(MESSAGES.piecesData, pieces);
    }, this));
};

Handlers.prototype.setUserNameAction = function(userName) {
    if (!(/^[A-Za-z0-9_]{3,20}$/).test(userName)) {
        this.session.send(MESSAGES.setUserName, {error: 'incorrect'});
        return;
    }

    var self = this;

    db.Users.checkName(userName, function(available) {
        if (!available && self.user.name != userName) {
            self.session.send(MESSAGES.setUserName, {error: 'duplicate'});
            return;
        }
		
		self.unlockSelectedPiece(function() {
			self.user.setName(userName, function() {
	            self.session.send(MESSAGES.setUserName);
	            self.leadersBoardAction();
	            self.userDataAction();
	        });
		});
    });
};

Handlers.prototype.lockPieceAction = function(coords) {
    if (this.selected) {return;}

    var self = this;
    
    self.puzzle.lockPiece(coords[0], coords[1], this.user.name, function(locked) {
        if (!locked) {return;}

        self.selected = coords;
        self.channel.broadcast(MESSAGES.lockPiece, {
            userName: self.user.name,
            coords: coords
        });
        self.session.startCountDown(function() {
            self.unlockSelectedPiece();
        });
    });
};

Handlers.prototype.unlockPieceAction = function(coords) {
	if (!this.selected) {this.selected = coords;}
	this.unlockSelectedPiece();
};

Handlers.prototype.swapPiecesAction = function(coords) {
    var self = this;
    self.puzzle.swap(coords[0][0], coords[0][1], coords[1][0], coords[1][1], self.user.name, function(swaped) {
        if (!swaped) {return;}

        self.selected = false;
        self.session.stopCountDown();
        self.broadcastUnlockPiece(coords[0]);
        self.channel.broadcast(MESSAGES.swapPieces, coords);

        self.puzzle.addSwap(function() {
            self.broadcastPuzzleData();
        });

        self.user.addSwap(self.puzzle._id, function() {
            if(swaped.found > 0) {
                self.addScore(swaped.found, swaped.completion);
            }
        });
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
    
    this.userDataAction();
    this.leadersBoardAction();
    this.broadcastPuzzleData();
};

Handlers.prototype.disconnect = function() {
    if (!this.initialized) {return;}

    this.unlockSelectedPiece();
	this.channel.remove(this.session);
    this.broadcastPuzzleData();
    this.leadersBoardAction();
};

Handlers.prototype.retrieveUser = function(userId, callback) {
    if (userId == null) {
        db.Users.addAnonymous(function(anonymous) {
            callback(anonymous);
        });
        return;
    }
    db.Users.get(userId, function(user) {
        if (user) {
            callback(user);
            return;
        }
        db.Users.addAnonymous(function(anonymous) {
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
    var points = 1000;

	if (completion < 100) {
		points = Math.ceil((100 - completion) / 4) * found;
	}

    flow.exec(
        function() {
            self.user.addScore(points, this.MULTI());
            self.user.addPuzzleScore(points, self.puzzle._id, this.MULTI());
            self.user.addFoundPieces(found, self.puzzle._id, this.MULTI());
        },
        function() {
            self.userDataAction();
            self.leadersBoardAction();
        });
};

Handlers.prototype.getPuzzleData = function(callback) {
    this.puzzle.compactInfo(_.bind(function(info) {
        db.Users.countOfLinkedWith(this.puzzle._id, _.bind(function(count) {
            callback(_.extend(info, {
                connected: this.channel.length(),
                participants: count
            }));
        }, this));
    }, this));
};

Handlers.prototype.broadcastPuzzleData = function() {
    this.getPuzzleData(_.bind(function(data) {
        this.channel.broadcast(MESSAGES.puzzleData, data);
    }, this));
};

Handlers.prototype.broadcastUnlockPiece = function(coords) {
    this.channel.broadcast(MESSAGES.unlockPiece, {
        userName: this.user.name,
        coords: coords
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

Handlers.prototype.unlockSelectedPiece = function(callback) {
	if (!this.selected) {return;}
	
	var x = this.selected[0];
	var y = this.selected[1];
    this.puzzle.unlockPiece(x, y, this.user.name, (function(unlocked) {
		var result = false;
		if (unlocked) {
			this.broadcastUnlockPiece(this.selected);
			this.session.stopCountDown();
			this.selected = false;
			result = true;
		}
		if (_.isFunction(callback)) {
			callback(result);
		}
	}).bind(this));
};

module.exports = Handlers;