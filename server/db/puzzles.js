var mongoose = require('mongoose');
var models = require('./models');
var flow = require('../../shared/flow');
var _ = require('../../shared/underscore')._;

var Query = mongoose.Query;
var Puzzles = models.Puzzles;
var Pieces = models.Pieces;

var lockedPieces = {};

function setExternals(puzzle) {
    if(_.isUndefined(lockedPieces[puzzle._id])) {
        lockedPieces[puzzle._id] = {};
    }
    puzzle.locked = lockedPieces[puzzle._id];
}

Puzzles.add = function(piecesData, settings, callback) {

    var puzzle = new Puzzles();
    puzzle.name = settings.name;
    puzzle.hLength = settings.hLength;
    puzzle.vLength = settings.vLength;
    puzzle.pieceSize = settings.pieceSize;
    puzzle.spriteSize = settings.spriteSize;
    puzzle.invisible = settings.invisible;
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
	try {
    	Puzzles.findById(id, function(error, puzzle) {
	        if(error) { throw error; }
	        if(puzzle) { setExternals(puzzle); }
	        callback(puzzle);
	    });
	} catch (error) {
		callback(null);
	}
};

Puzzles.last = function(callback) {
    var query = new Query()
        .where('invisible', false)
        .where('completed', null);
    
    var options = {
        sort: {'created': 1},
        limit: 1
    };
        
    Puzzles.find(query, [], options, function(error, puzzles) {
        if(error) {throw error;}
        setExternals(puzzles[0]);
        callback(puzzles[0]);
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
        id: data._id,
        name: data.name,
        hLength: data.hLength,
        vLength: data.vLength,
        swaps: data.swapsCount,
        pieceSize: data.pieceSize,
        spriteSize: data.spriteSize,
        created: data.created.getTime()
    };

    if (!_.isUndefined(data.completed)) {
        compact.completed = data.completed.getTime();
    }

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
               locked = self.locked[piece.y][piece.x];
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

Puzzles.prototype.unlock = function(x, y, userName) {
    if(_.isUndefined(this.locked) ||
       _.isUndefined(this.locked[y]) ||
       _.isUndefined(this.locked[y][x])) {
       return true;
    }

    if(!_.isEqual(this.locked[y][x], userName)) {
       return false;
    }

    delete this.locked[y][x];
    return true;
};

Puzzles.prototype.unlockAll = function(userName) {
    if(_.isUndefined(this.locked)) {
       return [];
    }
    
    var unlocked = [];
    _.each(this.locked, function(row, y) {
        _.each(row, function(piece, x) {
            if(_.isEqual(piece, userName)) {
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

Puzzles.prototype.swap = function(x1, y1, x2, y2, userName, callback) {
    if(!this.unlock(x1, y1, userName)) {
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

    var self = this;
    
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

                    var result = { found: 0, completion: 0 };
                    if (firstPiece.isCollected()) { result.found++; }
                    if (secondPiece.isCollected()) { result.found++; }

                    self.getCompletionPercentage(function(completion) {
                        if (completion == 100) {
                            self.completed = Date.now();
                            self.save();
                        }
                        result.completion = completion;
                        callback(result);
                    });
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

Puzzles.prototype.addSwap = function(callback) {
    Puzzles.findById(this._id, _.bind(function(error, puzzle) {
        this.swapsCount = puzzle.swapsCount + 1;
        this.save(function(error) {
            if(error) {throw error;}
            if(callback) {callback();}
        });
    }, this));
};

Pieces.prototype.isCollected = function() {
    var data = this.toObject();
    if(data.x == data.realX &&
       data.y == data.realY) {
        return true;
    }
    return false;
};

Pieces.prototype.isLocked = function() {
    if(_.isUndefined(lockedPieces[this.puzzleId][this.y]) ||
       _.isUndefined(lockedPieces[this.puzzleId][this.y][this.x])) {
        return false;
    }
    return true;
};

Pieces.prototype.lock = function(userName) {
    if(_.isUndefined(lockedPieces[this.puzzleId][this.y])) {
        lockedPieces[this.puzzleId][this.y] = {};
    }
    lockedPieces[this.puzzleId][this.y][this.x] = userName;
};

module.exports = Puzzles;