var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var PuzzlesSchema = new Schema({
    name        : String,
    userId      : ObjectId,
    pieceSize   : Number,
    spriteSize  : Number,
    piecesCount : Number,
    hLength     : Number,
    vLength     : Number,
    swapsCount  : {type: Number, 'default': 0},
    completion  : {type: Number, 'default': 0},
    invisible   : {type: Boolean, 'default': false},
    created     : {type: Date, 'default': Date.now, index: true},
    completed   : {type: Date, index: true}
});

var PiecesSchema = new Schema({
    x         : Number,
    y         : Number,
    realX     : Number,
    realY     : Number,
    puzzleId  : {type: ObjectId, index: true},
    locked    : {type: String, 'default': null, index: true},
    lockedAt  : {type: Number, 'default': null, index: true},
    ears      : {
        top     : Boolean,
        bottom  : Boolean,
        left    : Boolean,
        right   : Boolean
    }
});

var UsersSchema = new Schema({
    name    : {type: String, unique: true, index: true},
    created : {type: Date, 'default': Date.now, index: true},
    score   : {type: Number, 'default': 0},
    online  : {type: Number, 'default': 0},
    email   : {type: String, index: true},
    anonymous  : {type: Boolean, 'default': true},
    
    googleId   : {type: String, index: true},
    twitterId  : {type: String, index: true},
    facebookId : {type: String, index: true},
    yahooId    : {type: String, index: true},
    
    sessionId  : String,
    password   : String
});

var SessionsSchema = new Schema({
    sessionId : {type: String, unique: true, index: true},
    userId    : ObjectId
});

// TODO: Make this schema as a embedded doc in the "Users" doc
var UsersToPuzzlesSchema = new Schema({
    userId     : {type: ObjectId, index: true},
    puzzleId   : {type: ObjectId, index: true},
    swapsCount : {type: Number, 'default': 0},
    foundCount : {type: Number, 'default': 0},
    score      : {type: Number, 'default': 0}
});

mongoose.model('Users', UsersSchema);
mongoose.model('Pieces', PiecesSchema);
mongoose.model('Puzzles', PuzzlesSchema);
mongoose.model('Sessions', SessionsSchema);
mongoose.model('UsersToPuzzles', UsersToPuzzlesSchema);

module.exports = {
    Users: mongoose.model('Users'),
    Pieces: mongoose.model('Pieces'),
    Puzzles: mongoose.model('Puzzles'),
    Sessions: mongoose.model('Sessions'),
    UsersToPuzzles: mongoose.model('UsersToPuzzles')
};