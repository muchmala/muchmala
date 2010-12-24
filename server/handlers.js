var models = require('./models');

var events = {
    map: 'map',
    locked: 'locked',
    unlocked: 'unlocked',
    flipped: 'flipped'
};

function handlers(client, map) {
    var actions = {
        map: mapHandler,
        lock: lockHandler,
        unlock: unlockHandler,
        flip: flipHandler
    };

    var locked = null;

    client.on('message', function(data) {
        process(JSON.parse(data));
    });

    client.on('disconnect', function() {
        disconnectHandler();
    });

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

    function mapHandler() {
        map.getCompactInfo(function(compactMap) {
             client.send(createMessage(events.map, compactMap));
        });
    }

    function lockHandler(coords) {
        map.lock(coords[0], coords[1], client.sessionId, function(done) {
            if (done) {
                client.broadcast(createMessage(events.locked, coords));
            }
        });
    }

    function unlockHandler(coords) {
        map.unlock(coords[0], coords[1], client.sessionId, function(done) {
            if (done) {
                client.broadcast(createMessage(events.unlocked, [coords]));
            }
        });
    }

    function flipHandler(coords) {
        map.flip(coords[0][0], coords[0][1], coords[1][0], coords[1][1], client.sessionId, function(done) {
            if (done) {
                client.broadcast(createMessage(events.flipped, coords));
            }
        });
    }

    function disconnectHandler() {
        map.unlockAll(client.sessionId, function(pices) {
            client.broadcast(createMessage(events.unlocked, pices));
        });
    }
}

exports.handlers = handlers;