var db = require('./db');
var _ = require('../shared/underscore')._;
var Game = require('./game');

function Games() {
    this.games = {};
}

Games.prototype.getGame = function(puzzleId, callback) {
    puzzleId = puzzleId || 'last';
    
    if (!_.isUndefined(this.games[puzzleId])) {
        callback(this.games[puzzleId]);
        return;
    }
    
    getPuzzle(puzzleId, (function(puzzle) {
        if (_.isUndefined(this.games[puzzle.id])) {
            this.games[puzzle.id] = new Game(puzzle);
        }
        callback(this.games[puzzle.id]);
    }).bind(this));
};

Games.prototype.addPlayer = function(client, userId, puzzleId) {
    this.getGame(puzzleId, function(game) {
        game.addPlayer(client, userId);
    });
};

function getPuzzle(puzzleId, callback) {
    if (puzzleId == 'last') {
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
}

module.exports = Games;