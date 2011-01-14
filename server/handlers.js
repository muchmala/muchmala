var events = {
    map: 'map', user: 'user',
    initialized: 'initialized',
    pieceLocked: 'pieceLocked',
    pieceSelected: 'pieceSelected',
    piecesUnlocked: 'piecesUnlocked',
    pieceUnselected: 'pieceUnselected',
    piecesFlipped: 'piecesFlipped',
    completeLevel: 'completeLevel',
    connectedUsersCount: 'connectedUsersCount'
};

function handlers(client, maps, users) {
    var base = handlersBase(client);
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
                    base.broadcast(events.connectedUsersCount, connectedUsers.length);
                });
            });

            currentMap.unlockAll(currentUser._id, function(pices) {
                base.broadcast(events.piecesUnlocked, pices);
            });
        }
    });

    base.handlers.initialize = function(params) {
        if(params.userId) {
            users.getUser(params.userId, function(user) {
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

        function addAnonymous() {
            users.addUser('anonymous', function(user) {
                currentUser = user;
                getMapThenLinkToUserAndSend();
            });
        }

        function getMapThenLinkToUserAndSend() {
            maps.getLastMap(function(map) {
                currentMap = map;

                base.initialized = true;
                base.send(events.initialized);

                currentUser.linked2Map(currentMap._id, function(linked) {
                    if(!linked) {
                        currentUser.link2Map(currentMap._id);
                    }
                });

                currentMap.addConnectedUser(currentUser._id, function() {
                    currentMap.getConnectedUsers(function(connectedUsers) {
                        currentMap.getCompleteLevel(function(completeLevel) {
                            base.send(events.completeLevel, completeLevel);
                            base.send(events.connectedUsersCount, connectedUsers.length);
                            base.broadcast(events.connectedUsersCount, connectedUsers.length);
                        });
                    });
                });
            });
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
            base.send(events.user, result);
        });
    };

    base.handlers.map = function() {
        currentMap.getCompactInfo(function(compactMap) {
             base.send(events.map, compactMap);
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
            base.send(events.pieceSelected, coords);
            base.broadcast(events.pieceLocked, coords);
        });
    };

    base.handlers.unselect = function(coords) {
        currentMap.unlock(coords[0], coords[1], currentUser._id, function() {
            stopCountDown();
            base.send(events.pieceUnselected, coords);
            base.broadcast(events.piecesUnlocked, [coords]);
        });
    };

    base.handlers.flip = function(coords) {
        currentMap.flip(coords[0][0], coords[0][1], coords[1][0], coords[1][1], currentUser._id, function() {
            stopCountDown();
            base.send(events.piecesFlipped, coords);
            base.broadcast(events.piecesFlipped, coords);

            var correctFlipsNum = 0;

            for(var i = 0, gotPiecesQnt = 0; i < coords.length; i++) {
                currentMap.getPiece(coords[i][0], coords[i][1], function(piece) {
                    gotPiecesQnt++;

                    if(piece.x == piece.realX && piece.y == piece.realY) {
                        correctFlipsNum++;
                        if(gotPiecesQnt == coords.length) {
                            addScore();
                        }
                    }
                });
            }

            function addScore() {
                currentMap.getCompleteLevel(function(percent) {
                    var points = parseInt((100 - percent) / 2) * correctFlipsNum;
                    currentUser.addScore(currentMap._id, points, function() {
                        base.handlers.user();
                        currentMap.getCompleteLevel(function(completeLevel) {
                            base.send(events.completeLevel, completeLevel);
                        });
                    });
                });
            }
        });
    };

    function startCountDown() {
        countDown = setTimeout(function() {
            currentMap.unlockAll(currentUser._id, function(pices) {
                client.send(base.createMessage(events.piecesUnlocked, pices));
                client.broadcast(base.createMessage(events.piecesUnlocked, pices));
            });
        }, 20000);
    }

    function stopCountDown() {
        clearTimeout(countDown);
    }
}

function handlersBase(client) {

    function send(event, data) {
        client.send(this.createMessage(event, data));
    }

    function broadcast(event, data) {
        client.broadcast(this.createMessage(event, data));
    }

    function createMessage(event, data) {
        return JSON.stringify({
            event: event,
            data: data
        });
    }

    function process(message) {
        var handlerExists = message.action != null && this.handlers[message.action] != null;
        var handlerAvailable = this.initialized || message.action == 'initialize';

        if(handlerExists && handlerAvailable) {
            this.handlers[message.action].call(null, message.data);
        }
    }
    
    return {
        handlers: {},
        initialized: false,    
        send: send,
        broadcast: broadcast,
        createMessage: createMessage,
        process: process
    };
}

exports.handlers = handlers;