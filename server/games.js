var db = require('muchmala-common').db;
var _ = require('underscore');

var Game = require('./game');

var MESSAGES = require('../shared/messages');

function Games() {
    this.games = {};
}

Games.prototype.addPlayer = function(client, anonymousId, sessionId, puzzleId) {
    this._getGame(puzzleId, (function(game) {
        if (!game) {
            client.send(MESSAGES.noPuzzles);
            return;
        }
        
        this._getUser(anonymousId, sessionId, function(user) {
            game.addPlayer(client, user);
        });
    }).bind(this));
};

Games.prototype._getGame = function(puzzleId, callback) {
    puzzleId = puzzleId || 'last';
    
    if (!_.isUndefined(this.games[puzzleId])) {
        callback(this.games[puzzleId]);
        return;
    }
    
    this._getPuzzle(puzzleId, (function(puzzle) {
        if (!puzzle) {
            callback(false);
            return;
        }
        if (_.isUndefined(this.games[puzzle.id])) {
            this.games[puzzle.id] = new Game(puzzle);
        }
        callback(this.games[puzzle.id]);
    }).bind(this));
};

Games.prototype._getPuzzle = function(puzzleId, callback) {
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
};

Games.prototype._getUser = function(userId, sessionId, callback) {
    if (userId == null && sessionId == null) {
        addAnonymous();
        return;
    }
    
    if (sessionId) {
        db.Sessions.findUserId(sessionId, function(foundUserId) {
            if (foundUserId) {
                db.Users.getPermanent(foundUserId, processUser);
            } else if (userId) {
                db.Users.getAnonymous(userId, processUser);
            } else {
                addAnonymous();
            }
        });
    } else if (userId) {
        db.Users.getAnonymous(userId, processUser);
    } else {
        addAnonymous();
    }
    
    function addAnonymous() {
        db.Users.addAnonymous(function(user) {
            callback(user);
        });
    }
     
    function processUser(user) {
        if (user) {
            callback(user);
        } else {
            addAnonymous();
        }
    }
};

module.exports = Games;