var handlersBase = require('./handlersBase');
var flow = require('../shared/flow');
var db = require('./db');

var MESSAGES = require('../shared/messages');

function handlers(client) {
    var base = handlersBase.create(client);
    var user = null;
    var puzzle = null;
    var countDown = null;

    client.on('message', function(data) {
        base.process(JSON.parse(data));
    });

    client.on('disconnect', function() {
        if(puzzle) {
            puzzle.disconnectUser(user._id, function() {
                base.broadcast(MESSAGES.connectedUsersCount, puzzle.connected.length);
            });
            puzzle.unlockAll(user._id, function(pieces) {
                base.broadcast(MESSAGES.unlockPieces, pieces);
            });
        }
    });

    base.handlers.initialize = function(params) {
        if(!params.userId) {
            db.Users.add('anonymous', function(anonymous) {
                initialize(anonymous);
            });
            return;
        }

        db.Users.get(params.userId, function(found) {
            if(!found) {
                db.Users.add('anonymous', function(anonymous) {
                    initialize(anonymous);
                });
                return;
            }
            initialize(found);
        });
    };

    base.handlers.userData = function() {
        //TODO: getPuzzleScore method should return value (without callback)
        user.getPuzzleScore(puzzle._id, function(puzzleScore) {
            var data = user.toObject();
            base.send(MESSAGES.userData, {
                id: data._id,
                name: data.name,
                score: data.score,
                puzzleScore: puzzleScore
            });
        });
    };

    base.handlers.puzzleData = function() {
        puzzle.compact(function(compact) {
            base.send(MESSAGES.puzzleData, compact);
        });
    };

    base.handlers.setUserName = function(userName) {
        user.setName(userName, function() {
            base.handlers.user();
        });
    };

    base.handlers.selectPiece = function(coords) {
        if(puzzle.lock(coords[0], coords[1], user._id)) {
            base.send(MESSAGES.selectPiece, coords);
            base.broadcast(MESSAGES.lockPiece, coords);
            startCountDown();
        }
    };

    base.handlers.releasePiece = function(coords) {
        if(puzzle.unlock(coords[0], coords[1], user._id)) {
            base.send(MESSAGES.releasePiece, coords);
            base.broadcast(MESSAGES.unlockPieces, [coords]);
            stopCountDown();
        }
    };

    base.handlers.swapPieces = function(coords) {
        puzzle.swap(coords[0][0], coords[0][1], coords[1][0], coords[1][1], user._id, function(swaped) {
            if(!swaped) {return;}

            stopCountDown();
            base.send(MESSAGES.swapPieces, coords);
            base.broadcast(MESSAGES.swapPieces, coords);

            puzzle.getPiece(coords[0][0], coords[0][1], function(firstPiece) {
                puzzle.getPiece(coords[1][0], coords[1][1], function(secondPiece) {
                    var correctSwapsNum = 0;
                    if(firstPiece.isCollected()) { correctSwapsNum++; }
                    if(secondPiece.isCollected()) { correctSwapsNum++; }
                    addScore(correctSwapsNum);
                });
            });
        });
    };

    function addAnonymous() {
        db.Users.add('anonymous', function(anonymous) {
            user = anonymous;
            getPuzzleThenLinkToUserAndSend();
        });
    }

    function initialize(user) {
        db.Puzzles.last(function(lastPuzzle) {
            puzzle = lastPuzzle;
            puzzle.connectUser(user._id);
            base.send(MESSAGES.initialize);
            base.broadcast(MESSAGES.connectedUsersCount, puzzle.connected.length);
        });
    }

    function addScore(correctSwapsNum) {
        puzzle.getCompletionPercentage(function(percentage) {
            
            user.isLinkedWith(puzzle._id, function(linked) {
                if(!linked) {
                    user.linkWith(puzzle._id);
                }
            });

            var points = parseInt((100 - percentage) / 2) * correctSwapsNum;
            user.addScore(puzzle._id, points, this);

            base.handlers.userData();
            base.send(MESSAGES.completionPercentage, percentage);
        });
    }

    function startCountDown() {
        countDown = setTimeout(function() {
            puzzle.unlockAll(user._id, function(pices) {
                client.send(base.createMessage(MESSAGES.unlockPieces, pices));
                client.broadcast(base.createMessage(MESSAGES.unlockPieces, pices));
            });
        }, 20000);
    }

    function stopCountDown() {
        clearTimeout(countDown);
    }
}

exports.handlers = handlers;