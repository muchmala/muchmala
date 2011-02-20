var handlersBase = require('./handlersBase');
var flow = require('../shared/flow');
var db = require('./db');

var EVENTS = {
    map: 'map', user: 'user',
    initialized: 'initialized',
    pieceLocked: 'pieceLocked',
    pieceSelected: 'pieceSelected',
    piecesUnlocked: 'piecesUnlocked',
    pieceUnselected: 'pieceUnselected',
    piecesFlipped: 'piecesFlipped',
    completeLevel: 'completeLevel',
    leadersBoard: 'leadersBoard',
    connectedUsersCount: 'connectedUsersCount'
};

function handlers(client, maps, users) {
    var base = handlersBase.create(client);
    var currentMap = null;
    var currentUser = null;
    var countDown = null;

    client.on('message', function(data) {
        base.process(JSON.parse(data));
    });

    client.on('disconnect', function() {
        if(base.initialized) {
            currentMap.removeConnectedUser(currentUser._id, function() {
                currentMap.getConnectedUsers(function(connectedUsers) {
                    base.broadcast(EVENTS.connectedUsersCount, connectedUsers.length);
                });
            });

            currentMap.unlockAll(currentUser._id, function(pices) {
                base.broadcast(EVENTS.piecesUnlocked, pices);
            });
        }
    });

    base.handlers.initialize = function(params) {
        if(params.userId) {
            users.getUser(new db.ObjectId(params.userId), function(user) {
                if(user) {
                    currentUser = user;
                    getMapThenLinkToUserAndSend();
                } else {
                    addAnonymous();
                }
            });
        } else {
            addAnonymous();
        }
    };

    base.handlers.user = function() {
        currentUser.getData(function(data) {
            var result = {
                id: data._id,
                name: data.name,
                score: data.score
            };

            for(var i in data.maps) {
                if(data.maps[i].mapId.id == currentMap._id.id) {
                    result.currentScore = data.maps[i].score;
                    break;
                }
            }
            base.send(EVENTS.user, result);
        });
    };

    base.handlers.map = function() {
        currentMap.getCompactInfo(function(compactMap) {
             base.send(EVENTS.map, compactMap);
        });
    };

    base.handlers.updateUserName = function(userName) {
        currentUser.updateData({name: userName}, function() {
            base.handlers.user();
        });
    };

    base.handlers.select = function(coords) {
        currentMap.lock(coords[0], coords[1], currentUser._id, function() {
            startCountDown();
            base.send(EVENTS.pieceSelected, coords);
            base.broadcast(EVENTS.pieceLocked, coords);
        });
    };

    base.handlers.unselect = function(coords) {
        currentMap.unlock(coords[0], coords[1], currentUser._id, function() {
            stopCountDown();
            base.send(EVENTS.pieceUnselected, coords);
            base.broadcast(EVENTS.piecesUnlocked, [coords]);
        });
    };

    base.handlers.flip = function(coords) {
        currentMap.flip(coords[0][0], coords[0][1], coords[1][0], coords[1][1], currentUser._id, function() {
            stopCountDown();
            base.send(EVENTS.piecesFlipped, coords);
            base.broadcast(EVENTS.piecesFlipped, coords);
            var correctFlipsNum = 0;

            for(var i = 0, gotPiecesQnt = 0; i < coords.length; i++) {
                currentMap.getPiece(coords[i][0], coords[i][1], function(piece) {
                    gotPiecesQnt++;

                    if(piece.x == piece.realX && piece.y == piece.realY) {
                        correctFlipsNum++;
                        if(gotPiecesQnt == coords.length) {
                            addScore(correctFlipsNum);
                        }
                    }
                });
            }
        });
    };

    function addAnonymous() {
        users.addUser('anonymous', function(user) {
            currentUser = user;
            getMapThenLinkToUserAndSend();
        });
    }

    function getMapThenLinkToUserAndSend() {
        flow.exec(
            function() {
                maps.getLastMap(this);
            },
            function(map) {
                currentMap = map;
                base.initialized = true;
                base.send(EVENTS.initialized);
                currentUser.linked2Map(currentMap._id, function(linked) {
                    if(!linked) {
                        currentUser.link2Map(currentMap._id);
                    }
                });
                currentMap.addConnectedUser(currentUser._id, this);
            },
            function() {
                currentMap.getConnectedUsers(this);
            },
            function(connectedUsers) {
                currentMap.getCompleteLevel(this);
                base.send(EVENTS.connectedUsersCount, connectedUsers.length);
                base.broadcast(EVENTS.connectedUsersCount, connectedUsers.length);

            },
            function(completeLevel) {
                users.getUsersLinked2Map(currentMap._id, this);
                base.send(EVENTS.completeLevel, completeLevel);
            },
            function(users) {
                base.send(EVENTS.leadersBoard, users);
            }
        );
    }

    function addScore(correctFlipsNum) {
        flow.exec(
            function() {
                currentMap.getCompleteLevel(this);
            },
            function(percent) {
                var points = parseInt((100 - percent) / 2) * correctFlipsNum;
                currentUser.addScore(currentMap._id, points, this);
            },
            function() {
                base.handlers.user();
                currentMap.getCompleteLevel(this);
            },
            function(completeLevel) {
                base.send(EVENTS.completeLevel, completeLevel);
                users.getUsersLinked2Map(currentMap._id, this);
            },
            function(users) {
                base.send(EVENTS.leadersBoard, users);
                base.broadcast(EVENTS.leadersBoard, users);
            });
    }

    function startCountDown() {
        countDown = setTimeout(function() {
            currentMap.unlockAll(currentUser._id, function(pices) {
                client.send(base.createMessage(EVENTS.piecesUnlocked, pices));
                client.broadcast(base.createMessage(EVENTS.piecesUnlocked, pices));
            });
        }, 20000);
    }

    function stopCountDown() {
        clearTimeout(countDown);
    }
}

exports.handlers = handlers;