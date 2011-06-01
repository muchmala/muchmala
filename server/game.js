var db = require('./db');
var MESSAGES = require('../shared/messages');
var _ = require('../shared/underscore')._;
var flow = require('../shared/flow');
var Channel = require('./channel');
var Player = require('./player');

function Game(puzzle) {
    this.channel = new Channel(puzzle);
    this.puzzle = puzzle;
    
    var self = this;
    
    setInterval(function() {
        self.puzzle.unlockOldPieces(function(pieces) {
            _.each(pieces, function(coords) {
                self.broadcastUnlockPiece(coords);
            }); 
        });
    }, 60000);
}

Game.prototype.addPlayer = function(client, user) {
    var self = this;
    var player = new Player(client, self.puzzle, user);

    player.on('userNameChanged', function() {
        self.broadcastLeadersBoard();
    });
    player.on('scoreChanged', function() {
        self.broadcastLeadersBoard();
    });
    player.on('pieceUnlocked', function(coords) {
        self.broadcastUnlockPiece(coords, user.name);
    });
    player.on('pieceLocked', function(coords) {
        self.broadcastLockPiece(coords, user.name);
    });
    player.on('piecesSwapped', function(coords) {
        self.broadcastSwapPieces(coords);
        self.broadcastUnlockPiece(coords[0], user.name);
        self.puzzle.addSwap(function() {
            self.broadcastPuzzleData();
        });
    });

    self.channel.add(client);

    client.onDisconnect(function() {
        //@Todo: remove
        self.channel.remove(client);
        player.unlockSelectedPiece();
        user.online = false;
        user.save(function() {
            self.broadcastPuzzleData();
            self.broadcastLeadersBoard();
        });
    });
            
    user.online = true;
    user.save(function() {
        self.broadcastPuzzleData();
        self.broadcastLeadersBoard();
    });
};

Game.prototype.broadcastLeadersBoard = function() {
    this.getLeadersBoardData((function(data) {
        this.channel.broadcast(MESSAGES.leadersBoard, data);
    }).bind(this));
};

Game.prototype.broadcastPuzzleData = function() {
    this.getPuzzleData((function(data) {
        this.channel.broadcast(MESSAGES.puzzleData, data);
    }).bind(this));
};

Game.prototype.broadcastLockPiece = function(coords, userName) {
    this.channel.broadcast(MESSAGES.lockPiece, {
        userName: userName, coords: coords
    });
};

Game.prototype.broadcastUnlockPiece = function(coords, userName) {
    this.channel.broadcast(MESSAGES.unlockPiece, {
        userName: userName, coords: coords
    });
};

Game.prototype.broadcastSwapPieces = function(coords) {
    this.channel.broadcast(MESSAGES.swapPieces, coords);
};

Game.prototype.getPuzzleData = function(callback) {
    var connected = this.channel.length();
    var puzzleId = this.puzzle._id;
    
    this.puzzle.compactInfo(function(info) {
        db.Users.countOfLinkedWith(puzzleId, function(count) {
            callback(_.extend(info, {
                connected: connected,
                participants: count
            }));
        });
    });
};

Game.prototype.getLeadersBoardData = function(callback) {
    var self = this;
    var result = {};

    flow.exec(function() {
        db.Users.allLinkedWith(self.puzzle._id, this);
    }, function(users) {

        flow.serialForEach(users, function(user) {
            this.user = user;
            this.user.getPuzzleData(self.puzzle._id, this);
            
        }, function(puzzleData) {
            result[this.user._id] = {
                name: this.user.name,
                online: this.user.online,
                score: puzzleData.score,
                swaps: puzzleData.swaps,
                found: puzzleData.found
            };
        }, function() {
            callback(_.select(result, function(user) {
                return user.score && user.found;
            }));
        });
    });
};

module.exports = Game;