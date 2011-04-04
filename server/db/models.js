var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var PuzzlesSchema = new Schema({
    name        : String,
    pieceSize   : Number,
    piecesCount : Number,
    hLength     : Number,
    vLength     : Number,
    swapsCount  : {type: Number, 'default': 0},
    created     : {type: Date, 'default': Date.now},
    complete    : {type: Boolean, 'default': false},
    invisible   : {type: Boolean, 'default': false}
});

var PiecesSchema = new Schema({
    x         : Number,
    y         : Number,
    realX     : Number,
    realY     : Number,
    puzzleId  : ObjectId,
    ears      : {
        top     : Boolean,
        bottom  : Boolean,
        left    : Boolean,
        right   : Boolean
    }
});

var UsersSchema = new Schema({
    name    : String,
    score   : {type: Number, 'default': 0},
    created : {type: Date, 'default': Date.now}
});

// TODO: Make this schema as a embedded doc in the "Users" doc
var UsersToPuzzlesSchema = new Schema({
    userId     : ObjectId,
    puzzleId   : ObjectId,
    swapsCount : {type: Number, 'default': 0},
    foundCount : {type: Number, 'default': 0},
    score      : {type: Number, 'default': 0}
});

mongoose.model('Users', UsersSchema);
mongoose.model('Pieces', PiecesSchema);
mongoose.model('Puzzles', PuzzlesSchema);
mongoose.model('UsersToPuzzles', UsersToPuzzlesSchema);

module.exports = {
    Users: mongoose.model('Users'),
    Pieces: mongoose.model('Pieces'),
    Puzzles: mongoose.model('Puzzles'),
    UsersToPuzzles: mongoose.model('UsersToPuzzles')
};