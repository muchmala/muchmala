var mongoose = require('mongoose');
var models = require('./models');
var flow = require('../../shared/flow');
var _ = require('../../shared/underscore')._;

var Query = mongoose.Query;
var Puzzles = models.Puzzles;
var Pieces = models.Pieces;

var lockedPieces = {};
var connectedUsers = {};

function setExternals(puzzle) {
    if(_.isUndefined(connectedUsers[puzzle._id])) {
        connectedUsers[puzzle._id] = [];
    }
    if(_.isUndefined(lockedPieces[puzzle._id])) {
        lockedPieces[puzzle._id] = {};
    }
    puzzle.connected = connectedUsers[puzzle._id];
    puzzle.locked = lockedPieces[puzzle._id];
};

Puzzles.add = function(piecesData, hLength, vLength, pieceSize, name, callback) {
    var puzzle = new Puzzles();
    puzzle.name = name;
    puzzle.hLength = hLength;
    puzzle.vLength = vLength;
    puzzle.pieceSize = pieceSize;
    puzzle.piecesCount = piecesData.length;

    flow.exec(
        function() {
            puzzle.save(this);
        },
        function(error) {
            if (error) {throw error;}
            _.each(piecesData, function(pieceData) {
                var piece = new Pieces();
                piece.x = pieceData.x;
                piece.y = pieceData.y;
                piece.realX = pieceData.realX;
                piece.realY = pieceData.realY;

                piece.ears.top = pieceData.top;
                piece.ears.bottom = pieceData.bottom;
                piece.ears.left = pieceData.left;
                piece.ears.right = pieceData.right;
                
                piece.puzzleId = puzzle._id;
                piece.save(this.MULTI());
            }, this);
        }, function() {
            callback(puzzle);
        });
};

Puzzles.get = function(id, callback) {
    Puzzles.findById(id, function(error, puzzle) {
        if(error) {throw error;}
        setExternals(puzzle);
        callback(puzzle);
    });
};

//TODO: Add sorting by "created" when it is fixed in mongoose
Puzzles.last = function(callback) {
    Puzzles.find(function(error, puzzles) {
        if(error) {throw error;}
        var puzzle = puzzles.pop();
        setExternals(puzzle);
        callback(puzzle);
    });
};

Puzzles.prototype.getPiece = function(x, y, callback) {
    var query = new Query()
        .where('x', x)
        .where('y', y)
        .where('puzzleId', this._id);

    Pieces.findOne(query, function(error, piece) {
        if(error) {throw error;}
        callback(piece);
    });
};

Puzzles.prototype.compactInfo = function(callback) {
    var data = this.toObject();
    var compact = {
        name: data.name,
        hLength: data.hLength,
        vLength: data.vLength,
        pieceSize: data.pieceSize,
        created: data.created.getTime(),
        connected: this.connected.length
    };

    this.getCompletionPercentage(function(percentage) {
        compact.completion = percentage;
        callback(compact);
    });
};

Puzzles.prototype.compactPieces = function(callback) {
    var self = this;
    
    Pieces.find({puzzleId: this._id}, function(error, found) {
        if(error) {throw error;}
        
        var pieces = _.map(found, function(piece) {
            piece = piece.toObject();
            
            var locked = false;
            if(!_.isUndefined(self.locked) &&
               !_.isUndefined(self.locked[piece.y]) &&
               !_.isUndefined(self.locked[piece.y][piece.x])) {
               locked = true;
            }
            
            return {
                t: piece.ears.top,
                l: piece.ears.left,
                b: piece.ears.bottom,
                r: piece.ears.right,
                realX: piece.realX,
                realY: piece.realY,
                x: piece.x, y: piece.y,
                d: locked
            };
        });

        callback(pieces);
    });
};

Puzzles.prototype.lock = function(x, y, userId) {
    if(_.isUndefined(this.locked[y])) {
        this.locked[y] = {};
    }
    if(_.isUndefined(this.locked[y][x])) {
        this.locked[y][x] = userId;
        return true;
    }
    return false;
};

Puzzles.prototype.unlock = function(x, y, userId) {
    if(_.isUndefined(this.locked) ||
       _.isUndefined(this.locked[y]) ||
       _.isUndefined(this.locked[y][x])) {
       return true;
    }

    if(!_.isEqual(this.locked[y][x], userId)) {
       return false;
    }

    delete this.locked[y][x];
    return true;
};

Puzzles.prototype.unlockAll = function(userId) {
    if(_.isUndefined(this.locked)) {
       return [];
    }
    
    var unlocked = [];
    _.each(this.locked, function(row, y) {
        _.each(row, function(piece, x) {
            if(_.isEqual(piece, userId)) {
                unlocked.push([x, y]);
            }
        });
    });

    var self = this;
    _.each(unlocked, function(coords) {
        delete self.locked[coords[1]][coords[0]];
    })

    return unlocked;
};

Puzzles.prototype.connectUser = function(userId) {
    if(_.include(this.connected, userId)) {
        throw new Error('Trying to connect already connected user');
    }
    this.connected.push(userId);
};

Puzzles.prototype.disconnectUser = function(userId) {
    if(!_.include(this.connected, userId)) {
        throw new Error('Trying to disconnect not connected user');
    }
    this.connected.splice(this.connected.indexOf(userId), 1);
};

Puzzles.prototype.isConnected = function(userId) {
    var connected = _.detect(this.connected, function(connected) {
        return _.isEqual(connected, userId);
    });
    if(connected) {
        return true;
    }
    return false;
};

Puzzles.prototype.swap = function(x1, y1, x2, y2, userId, callback) {
    if(!this.unlock(x1, y1, userId)) {
        callback(false);
    }

    var firstQ = new Query()
        .where('x', x1)
        .where('y', y1)
        .where('puzzleId', this._id);
    
    var secondQ = new Query()
        .where('x', x2)
        .where('y', y2)
        .where('puzzleId', this._id);
    
    Pieces.findOne(firstQ, function(error, firstPiece) {
        if(error) {throw error;}
        if(_.isNull(firstPiece)) {
            callback(false);
            return;
        }
        
        Pieces.findOne(secondQ, function(error, secondPiece) {
            if(error) {throw error;}
            if(_.isNull(secondPiece)) {
                callback(false);
                return;
            }

            var tmpX = firstPiece.realX;
            var tmpY = firstPiece.realY;
            firstPiece.realX = secondPiece.realX;
            firstPiece.realY = secondPiece.realY;
            secondPiece.realX = tmpX;
            secondPiece.realY = tmpY;

            firstPiece.save(function(error) {
                if(error) {throw error;}
                secondPiece.save(function(error) {
                    if(error) {throw error;}
                    callback(true);
                });
            });
            
        });
    })
};

Puzzles.prototype.getCompletionPercentage = function(callback) {

    Pieces.find({puzzleId: this._id}, function(error, found) {
        if(error) {throw error;}

        var collected = 0;
        _.each(found, function(piece) {
            if(piece.isCollected()) {
                collected++;
            }
        });

        callback(Math.floor(100 / found.length * collected));
    });
};

Pieces.prototype.isCollected = function() {
    var data = this.toObject();
    if(data.x == data.realX &&
       data.y == data.realY) {
        return true;
    }
    return false;
};

module.exports = Puzzles;