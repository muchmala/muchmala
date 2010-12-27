var events = {
    map: 'map',
    user: 'user',
    locked: 'locked',
    unlocked: 'unlocked',
    selected: 'selected',
    unselected: 'unselected',
    flipped: 'flipped'
};

function handlers(client, maps, users) {
    var actions = {
        map: mapHandler,
        user: userHandler,
        flip: flipHandler,
        select: selectHandler,
        unselect: unselectHandler,
        updateUserName: updateUserNameHandler
    };

    var currentMap = null;
    var currentUser = null;

    client.on('message', function(data) {
        process(JSON.parse(data));
    });

    client.on('disconnect', function() {
        disconnectHandler();
    });

    function userHandler(userId) {
        if(userId) {
            users.getUser(userId, function(user) {
                if(user) {
                    currentUser = user;
                    sendCurrentUserData();
                } else {
                    addAnonimus();
                }
            });
        } else {
            addAnonimus();
        }
    }

    function updateUserNameHandler(userName) {
        currentUser.updateData({name: userName}, function(userData) {
            sendCurrentUserData();
        });
    }

    function mapHandler(data) {
        //data.mapId
        maps.getLastMap(function(map) {
            currentMap = map;
            currentMap.getCompactInfo(function(compactMap) {
                 client.send(createMessage(events.map, compactMap));
            });
        });
    }

    function selectHandler(coords) {
        currentMap.lock(coords[0], coords[1], client.sessionId, function(done) {
            if (done) {
                client.send(createMessage(events.selected, coords));
                client.broadcast(createMessage(events.locked, coords));
            }
        });
    }

    function unselectHandler(coords) {
        currentMap.unlock(coords[0], coords[1], client.sessionId, function(done) {
            if (done) {
                client.send(createMessage(events.unselected, coords));
                client.broadcast(createMessage(events.unlocked, [coords]));
            }
        });
    }

    function flipHandler(coords) {
        currentMap.flip(coords[0][0], coords[0][1], coords[1][0], coords[1][1], client.sessionId, function(done) {
            if (done) {
                client.broadcast(createMessage(events.flipped, coords));
            }
        });
    }

    function disconnectHandler() {
        currentMap.unlockAll(client.sessionId, function(pices) {
            client.broadcast(createMessage(events.unlocked, pices));
        });
    }

    function createMessage(event, data) {
        return JSON.stringify({
            event: event,
            data: data
        });
    }

    function process(message) {
        if(message.action != null &&
           actions[message.action] != null) {
            actions[message.action].call(null, message.data);
        }
    }

    function sendCurrentUserData() {
        currentUser.getData(function(data) {
            client.send(createMessage(events.user, {
                id: data._id,
                name: data.name,
                score: 0
            }));
        });
    }

    function addAnonimus() {
        users.addUser('anonimus', function(user) {
            currentUser = user;
            sendCurrentUserData();
        });
    }
}

exports.handlers = handlers;