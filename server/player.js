var db = require('./db');
var EventEmitter = require('events').EventEmitter
var MESSAGES = require('../shared/messages');
var _ = require('../shared/underscore')._;
var flow = require('../shared/flow');

function Player(client, puzzle, user) {
    this.client = client;
    this.selected = false;
    this.puzzle = puzzle;
    this.user = user;

    var self = this;
    
    this.client.onMessage(function(message) {
        if(!_.isString(message.action)) {return;}
        var methodName = message.action + 'Action';
        if(_.isFunction(self[methodName])) {
            self[methodName].call(self, message.data);
        }
    });
    
    this.client.send(MESSAGES.initialized);
    this.userDataAction();
}

Player.prototype = new EventEmitter();

Player.prototype.userDataAction = function() {
    this.user.getPuzzleData(this.puzzle._id, (function(puzzleData) {
        var userData = this.user.toObject();
        this.client.send(MESSAGES.userData, {
            id: userData._id,
            name: userData.name,
            score: puzzleData.score,
            swaps: puzzleData.swaps,
            found: puzzleData.found
        });
    }).bind(this));
};

Player.prototype.puzzleDataAction = function() {
    this.getPuzzleData(_.bind(function(data) {
        this.client.send(MESSAGES.puzzleData, data);
    }, this));
};

Player.prototype.piecesDataAction = function() {
    this.puzzle.compactPieces(_.bind(function(pieces) {
        this.client.send(MESSAGES.piecesData, pieces);
    }, this));
};

Player.prototype.setUserNameAction = function(userName) {
    if (!(/^[A-Za-z0-9_]{3,20}$/).test(userName)) {
        this.client.send(MESSAGES.setUserName, {error: 'incorrect'});
        return;
    }

    var self = this;

    db.Users.checkName(userName, function(available) {
        if (!available && self.user.name != userName) {
            self.client.send(MESSAGES.setUserName, {error: 'duplicate'});
            return;
        }
        
        self.unlockSelectedPiece(function() {
            self.user.setName(userName, function() {
                self.client.send(MESSAGES.setUserName);
                self.emit('userNameChanged');
                self.userDataAction();
            });
        });
    });
};

Player.prototype.lockPieceAction = function(coords) {
    if (this.selected) { return; }
    
    var self = this;
    this.puzzle.lockPiece(coords[0], coords[1], this.user.name, function(locked) {
        if (!locked) {return;}
        self.selected = coords;
        self.emit('pieceLocked', coords);
        self.client.startCountDown(function() {
            self.unlockSelectedPiece();
        });
    });
};

Player.prototype.unlockPieceAction = function(coords) {
    this.puzzle.unlockPiece(coords[0], coords[1], this.user.name, (function(unlocked) {
        if (!unlocked) {return;}
        this.selected = false;
        this.emit('pieceUnlocked', coords);
        this.client.stopCountDown();
    }).bind(this));
};

Player.prototype.swapPiecesAction = function(coords) {
    var self = this;
    this.puzzle.swap(coords[0][0], coords[0][1], coords[1][0], coords[1][1], self.user.name, function(swaped) {
        if (!swaped) {return;}

        self.selected = false;
        self.client.stopCountDown();
        self.emit('piecesSwapped', coords);
        
        self.user.addSwap(self.puzzle._id, function() {
            if(swaped.found.length > 0) {
                self.addScore(swaped.found, swaped.completion);
            }
        });
    });
};

Player.prototype.addScore = function(found, completion) {
    var self = this;
    var points = 1000;
    var foundCount = found.length;

    if (completion < 100) {
        points = Math.ceil((100 - completion) / 4);
    }

    flow.exec(
        function() {
            self.user.addScore(points * foundCount, this.MULTI());
            self.user.addPuzzleScore(points * foundCount, self.puzzle._id, this.MULTI());
            self.user.addFoundPieces(foundCount, self.puzzle._id, this.MULTI());
        },
        function() {
            self.emit('scoreChanged');
            self.client.send(MESSAGES.scoreAdded, _.map(found, function(piece) {
                return {x: piece[0], y: piece[1], pts: points};
            }));
        });
};

Player.prototype.unlockSelectedPiece = function(callback) {
    if (!this.selected) {
        if (callback) {
            callback(false);
        }
        return;
    }
    var x = this.selected[0];
    var y = this.selected[1];
    
    this.puzzle.unlockPiece(x, y, this.user.name, (function(unlocked) {
        if (!unlocked) {
            if (callback) {
                callback(false);
            }
            return;
        }
        this.emit('pieceUnlocked', this.selected);
        this.selected = false;
        if (callback) {
            callback(true);
        }
        
    }).bind(this));
};

module.exports = Player;