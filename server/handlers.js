var events = {
    map: 'map',
    user: 'user',
    locked: 'locked',
    unlocked: 'unlocked',
    selected: 'selected',
    unselected: 'unselected',
    initialized: 'initialized',
    connectedUsersCount: 'connectedUsersCount',
    flipped: 'flipped'
};

function handlers(client, maps, users) {
    var base = handlersBase();

    base.actions = {
        map: mapHandler,
        user: userHandler,
        flip: flipHandler,
        select: selectHandler,
        unselect: unselectHandler,
        initialize: initializeHandler,
        updateUserName: updateUserNameHandler
    };

    var currentMap = null;
    var currentUser = null;
    var countDown = null;

    client.on('message', function(data) {
        base.process(JSON.parse(data));
    });

    client.on('disconnect', function() {
        disconnectHandler();
    });

    function initializeHandler(params) {
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

                currentUser.linked2Map(currentMap._id, function(linked) {
                    if(!linked) {
                        currentUser.link2Map(currentMap._id);
                    }
                });
                
                currentMap.addConnectedUser(currentUser._id, function() {
                    currentMap.getConnectedUsers(function(connectedUsers) {
                        client.send(base.createMessage(events.connectedUsersCount, connectedUsers.length));
                        client.broadcast(base.createMessage(events.connectedUsersCount, connectedUsers.length));
                    });
                });

                client.send(base.createMessage(events.initialized));
            });
        }
    }

    function userHandler() {
        currentUser.getData(function(data) {
            client.send(base.createMessage(events.user, {
                id: data._id,
                name: data.name,
                score: 0
            }));
        });
    }

    function updateUserNameHandler(userName) {
        currentUser.updateData({name: userName}, function(userData) {
            userHandler();
        });
    }

    function mapHandler() {
        currentMap.getCompactInfo(function(compactMap) {
             client.send(base.createMessage(events.map, compactMap));
        });
    }

    function selectHandler(coords) {
        currentMap.lock(coords[0], coords[1], client.sessionId, function(done) {
            if (done) {
                startCountDown();
                client.send(base.createMessage(events.selected, coords));
                client.broadcast(base.createMessage(events.locked, coords));
            }
        });
    }

    function unselectHandler(coords) {
        currentMap.unlock(coords[0], coords[1], client.sessionId, function(done) {
            if (done) {
                stopCountDown();
                client.send(base.createMessage(events.unselected, coords));
                client.broadcast(base.createMessage(events.unlocked, [coords]));
            }
        });
    }

    function flipHandler(coords) {
        currentMap.flip(coords[0][0], coords[0][1], coords[1][0], coords[1][1], client.sessionId, function(done) {
            if (done) {
                stopCountDown();
                client.send(base.createMessage(events.flipped, coords));
                client.broadcast(base.createMessage(events.flipped, coords));
            }
        });
    }

    function disconnectHandler() {
        if(!currentMap || !currentUser) {
            return;
        }

        currentMap.removeConnectedUser(currentUser._id, function() {
            currentMap.getConnectedUsers(function(connectedUsers) {
                client.broadcast(base.createMessage(events.connectedUsersCount, connectedUsers.length));
            });
        });

        currentMap.unlockAll(client.sessionId, function(pices) {
            client.broadcast(base.createMessage(events.unlocked, pices));
        });
    }

    function startCountDown() {
        countDown = setTimeout(function() {
            currentMap.unlockAll(client.sessionId, function(pices) {
                client.send(base.createMessage(events.unlocked, pices));
                client.broadcast(base.createMessage(events.unlocked, pices));
            });
        }, 20000);
    }

    function stopCountDown() {
        clearTimeout(countDown);
    }
}

function handlersBase() {
    return {
        actions: {},
        createMessage: function(event, data) {
            return JSON.stringify({
                event: event,
                data: data
            });
        },
        process: function(message) {
            if(message.action != null &&
               this.actions[message.action] != null) {
                this.actions[message.action].call(null, message.data);
            }
        }
    };
}

exports.handlers = handlers;