var mongoose = require('mongoose');
var models = require('./models');
var flow = require('../../shared/flow');
var _ = require('../../shared/underscore')._;

var Query = mongoose.Query;
var Puzzles = models.Puzzles;
var Pieces = models.Pieces;

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
        callback(puzzle);
    });
};

//TODO: Add sorting by "created" when it is fixed in mongoose
Puzzles.last = function(callback) {
    Puzzles.find(function(error, puzzles) {
        if(error) {throw error;}
        callback(puzzles.pop());
    });
};

Puzzles.prototype.compact = function(callback) {
    Pieces.find({puzzleId: this._id}, function(error, found) {
        if(error) {throw error;}
        
        var pieces = _.map(found, function(piece) {
            piece = piece.toObject();
            var locked = false;

            if(_.isUndefined(this.locked) ||
               _.isUndefined(this.locked[piece.y]) ||
               _.isUndefined(this.locked[piece.y][piece.x])) {
               locked = true;
            }
            
            return {
                t: piece.ears.top,
                l: piece.ears.left,
                b: piece.ears.bottom,
                r: piece.ears.right,
                x: piece.realX,
                y: piece.realY,
                d: locked
            };
        });

        callback({
            id: this._id,
            name: this.name,
            hLength: this.hLength,
            vLength: this.vLength,
            piceSize: this.pieceSize,
            created: this.created,
            pieces: pieces
        });
    });
};

Puzzles.prototype.lock = function(x, y, userId) {
    if(_.isUndefined(this.locked)) {
        this.locked = {};
    }
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
       return;
    }

    var result = {};
    _.each(this.locked, function(row, y) {
        result[y] = {};
        _.each(row, function(piece, x) {
            if(!_.isEqual(piece, userId)) {
                result[y][x] = piece;
            }
        });
    });

    this.locked = result;
};

Puzzles.prototype.connectUser = function(userId) {
    if(_.isUndefined(this.connected)) {
        this.connected = [];
    }
    if(_.indexOf(this.connected, userId) != -1) {
        throw new Error('Trying to connect already connected user');
    }

    this.connected.push(userId);
};

Puzzles.prototype.disconnectUser = function(userId) {
    if(_.isUndefined(this.connected) ||
       _.indexOf(this.connected, userId) == -1) {
        throw new Error('Trying to disconnect not connected user');
    }

    this.connected = _.without(this.connected, userId);
};

Puzzles.prototype.swap = function(x1, y1, x2, y2, userId, callback) {
    if(!this.unlock()) {
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
            piece = piece.toObject();
            if(piece.x == piece.realX &&
               piece.y == piece.realY) {
                collected++;
            }
        });

        callback(Math.floor(100 / found.length * collected));
    });
};

module.exports = Puzzles;