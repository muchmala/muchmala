var mongoose = require('mongoose');
var models = require('./models');
var flow = require('../../shared/flow');
var _ = require('../../shared/underscore')._;

var Query = mongoose.Query;
var Puzzles = models.Puzzles;
var Pieces = models.Pieces;

Puzzles.add = function(piecesData, settings, callback) {

    var puzzle = new Puzzles();
    puzzle.name = settings.name;
    puzzle.hLength = settings.hLength;
    puzzle.vLength = settings.vLength;
    puzzle.pieceSize = settings.pieceSize;
    puzzle.spriteSize = settings.spriteSize;
    puzzle.invisible = settings.invisible;
    puzzle.piecesCount = piecesData.length;
    
    if (_.isString(settings.userId)) {
        puzzle.userId = settings.userId;
    }

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
            var query = new Query()
                .where('invisible', false)
                .where('completed', null);
                
            Puzzles.count(query, function(error, queueIndex) {
                callback(puzzle, queueIndex);
            });
        });
};

Puzzles.get = function(id, callback) {
    try {
        Puzzles.findById(id, function(error, puzzle) {
            if(error) { throw error; }
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
    var time = Date.now();
    
    Pieces.collection.find({puzzleId: this._id}, {}, function(error, cursor) {
        if(error) {throw error;}
        
        var result = []
        
        cursor.each(function(err, piece) {
            if (piece == null) {
                callback(result);
                return;
            }
            
            result.push({
                t: piece.ears.top,
                l: piece.ears.left,
                b: piece.ears.bottom,
                r: piece.ears.right,
                realX: piece.realX,
                realY: piece.realY,
                d: piece.locked,
                x: piece.x, 
                y: piece.y
            });
        });
    });
};

Puzzles.prototype.lockPiece = function(x, y, userName, callback) {
    var query = new Query()
        .where('x', x).where('y', y)
        .where('locked', null)
        .where('puzzleId', this._id);
    
    var data = {
        locked: userName,
        lockedAt: Date.now()
    };
    
    Pieces.update(query, data, {safe: true}, function(error, piece) {
        if (error || _.isNull(piece)) {
            callback(false);
            return;
        }
        callback(true);
    });
};

Puzzles.prototype.unlockPiece = function(x, y, userName, callback) {
    var query = new Query()
        .where('x', x).where('y', y)
        .where('puzzleId', this._id)
        .where('locked', userName);
    
    var data = {
        locked: null, 
        lockedAt: null
    };
    
    Pieces.update(query, data, {safe: true}, function(error, piece) {
        if (error || _.isNull(piece)) {
            callback(false);
            return;
        }
        callback(true);
    }); 
};

Puzzles.prototype.unlockOldPieces = function(callback) {
    var past = parseInt(Date.now() - 60000);
    var query = new Query()
        .lte('lockedAt', past)
        .where('puzzleId', this._id)
        .where('locked').ne(null);
        
    Pieces.find(query, function(error, pieces) {
        if (error) { callback(false); return; }
        
        var locked = _.map(pieces, function(piece) {
            piece = piece.toObject();
            return [piece.x, piece.y];
        });
        
        Pieces.update(query, {locked: null}, {multy: true}, function(error) {
            if (error) { callback(false); return; }
            callback(locked);
        });
    });
};

Puzzles.prototype.isPieceLockedBy = function(x, y, userName, callback) {
    var query = new Query()
        .where('x', x).where('y', y)
        .where('puzzleId', this._id);
        
    Pieces.findOne(query, function(error, piece) {
        if (error || piece.locked != userName) {
            callback(false);
            return;
        }
        callback(true);
    });
};

Puzzles.prototype.swap = function(x1, y1, x2, y2, userName, callback) {
    var self = this;
    
    flow.exec(
        function() {
            self.isPieceLockedBy(x1, y1, userName, this);
        },
        function(locked) {
            if (!locked) {callback(false); return;}
            self.lockPiece(x2, y2, userName, this);
        },
        function(locked) {
            if (!locked) {callback(false); return;}
            self.getPiece(x1, y1, this);
        },
        function(piece) {
            if (_.isNull(piece)) {callback(false); return;}
            this.first = piece;
            self.getPiece(x2, y2, this);
        },
        function(piece) {
            if (_.isNull(piece)) {callback(false); return;}
            this.second = piece;
            
            var tmpX = this.first.realX;
            var tmpY = this.first.realY;
            this.first.realX = this.second.realX;
            this.first.realY = this.second.realY;
            this.second.realX = tmpX;
            this.second.realY = tmpY;
            
            this.first.locked = null;
            this.second.locked = null;

            this.first.save(this.MULTI());
            this.second.save(this.MULTI());
        }, function() {
            var result = { found: [], completion: 0 };
            if (this.first.isCollected()) { result.found.push([x1, y1]); }
            if (this.second.isCollected()) { result.found.push([x2, y2]); }
            
            self.getCompletionPercentage(function(completion) {
                if (completion == 100) {
                    self.completed = Date.now();
                    self.save();
                }
                result.completion = completion;
                callback(result);
            });
        });
};

Puzzles.prototype.getCompletionPercentage = function(callback) {
    Pieces.collection.find({puzzleId: this._id}, {}, function(error, cursor) {
        if(error) {throw error;}

        var collected = 0;
        var length = 0;
        
        cursor.each(function(err, piece) {
            if (piece == null) {
                callback(Math.ceil(100 / length * collected));
                return;
            }
            
            if(piece.x == piece.realX &&
               piece.y == piece.realY) {
                collected++;
            }
            length++;
        });
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

module.exports = Puzzles;