var handlersBase = require('./handlersBase');
var flow = require('../shared/flow');
var db = require('./db');

var MESSAGES = {
    puzzle: 'puzzle', user: 'user',
    initialized: 'initialized',
    pieceLocked: 'pieceLocked',
    pieceSelected: 'pieceSelected',
    piecesUnlocked: 'piecesUnlocked',
    pieceUnselected: 'pieceUnselected',
    piecesSwaped: 'piecesSwaped',
    completionPercentage: 'completionPercentage',
    connectedUsersCount: 'connectedUsersCount',
    leadersBoard: 'leadersBoard'
};

function handlers(client) {
    var base = handlersBase.create(client);
    var user = null;
    var puzzle = null;
    var countDown = null;

    client.on('message', function(data) {
        base.process(JSON.parse(data));
    });

    client.on('disconnect', function() {
        if(base.initialized) {
            puzzle.connectUser(user._id, function() {
                base.broadcast(MESSAGES.connectedUsersCount, puzzle.connected.length);
            });
            puzzle.unlockAll(user._id, function(pieces) {
                base.broadcast(MESSAGES.piecesUnlocked, pieces);
            });
        }
    });

    base.handlers.initialize = function(params) {
        if(params.userId) {
            db.Users.get(params.userId, function(_user) {
                if(user) {
                    user = _user;
                    getPuzzleThenLinkToUserAndSend();
                } else {
                    addAnonymous();
                }
            });
        } else {
            addAnonymous();
        }
    };

    base.handlers.user = function() {
        //TODO: getPuzzleScore method should return value (without callback)
        user.getPuzzleScore(puzzle._id, function(puzzleScore) {
            var data = user.toObject();
            base.send(MESSAGES.user, {
                id: data._id,
                name: data.name,
                score: data.score,
                puzzleScore: puzzleScore
            });
        });
    };

    base.handlers.puzzle = function() {
        puzzle.compact(function(compact) {
            base.send(MESSAGES.puzzle, compact);
        });
    };

    base.handlers.setUserName = function(userName) {
        user.setName(userName, function() {
            base.handlers.user();
        });
    };

    base.handlers.select = function(coords) {
        puzzle.lock(coords[0], coords[1], user._id, function(locked) {
            if(locked) {
                base.send(MESSAGES.pieceSelected, coords);
                base.broadcast(MESSAGES.pieceLocked, coords);
                startCountDown();
            }
        });
    };

    base.handlers.release = function(coords) {
        puzzle.unlock(coords[0], coords[1], user._id, function(unlocked) {
            if(unlocked) {
                base.send(MESSAGES.pieceUnselected, coords);
                base.broadcast(MESSAGES.piecesUnlocked, [coords]);
                stopCountDown();
            }
        });
    };

    base.handlers.swap = function(coords) {
        puzzle.swap(coords[0][0], coords[0][1], coords[1][0], coords[1][1], user._id, function(swaped) {
            if(!swaped) {return;}

            stopCountDown();
            base.send(MESSAGES.piecesFlipped, coords);
            base.broadcast(MESSAGES.piecesFlipped, coords);

            puzzle.getPiece(coords[0][0], piece[0][1], function(firstPiece) {
                puzzle.getPiece(coords[1][0], piece[1][1], function(secondPiece) {
                    var correctSwapsNum = 0;
                    if(firstPiece.isCollected()) { correctSwapsNum++; }
                    if(secondPiece.isCollected()) { correctSwapsNum++; }
                    addScore(correctSwapsNum);
                });
            });
        });
    };

    function addAnonymous() {
        db.Users.add('anonymous', function(_user) {
            user = _user;
            getPuzzleThenLinkToUserAndSend();
        });
    }

    function getPuzzleThenLinkToUserAndSend() {
        flow.exec(
            function() {
                db.Puzzles.last(this);
            },
            function(_puzzle) {
                puzzle = _puzzle;

                base.initialized = true;
                base.send(MESSAGES.initialized);

                //TODO: User should be linked when has a score > 0
                user.isLinkedWith(puzzle._id, function(linked) {
                    if(!linked) {
                        user.linkWith(puzzle._id);
                    }
                });

                puzzle.connectUser(user._id);
                base.send(MESSAGES.connectedUsersCount, puzzle.connected.length);
                base.broadcast(MESSAGES.connectedUsersCount, puzzle.connected.length);
                
                puzzle.getCompletionPercentage(this);
            },
            function(completeLevel) {
                base.send(MESSAGES.completeLevel, completeLevel);
            }
        );
    }

    function addScore(correctSwapsNum) {
        flow.exec(
            function() {
                puzzle.getCompletionPercentage(this);
            },
            function(percent) {
                var points = parseInt((100 - percent) / 2) * correctSwapsNum;
                user.addScore(puzzle._id, points, this);
            
                base.handlers.user();
                base.send(MESSAGES.completeLevel, percent);
            });
    }

    function startCountDown() {
        countDown = setTimeout(function() {
            puzzle.unlockAll(user._id, function(pices) {
                client.send(base.createMessage(MESSAGES.piecesUnlocked, pices));
                client.broadcast(base.createMessage(MESSAGES.piecesUnlocked, pices));
            });
        }, 20000);
    }

    function stopCountDown() {
        clearTimeout(countDown);
    }
}

exports.handlers = handlers;