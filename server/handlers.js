var models = require('./models');

var events = {
    map: 'map',
    locked: 'locked',
    unlocked: 'unlocked',
    changed: 'changed'
};

function handlers(client, map) {

    var actions = {
        map: mapHandler,
        lock: lockHandler,
        unlock: unlockHandler,
        change: flipHandler
    };

    var locked = null;

    client.on('message', function(data) {
        process(JSON.parse(data));
    });

    client.on('disconnect', function() {
        map.unlockAll(client.sessionId, function(result) {
            for (var i in result) {
                client.broadcast(createMessage(events.unlocked, result[i]));
            }
        });
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
        })
    }

    function lockHandler(coordinates) {
        map.lock(coordinates[0], coordinates[1], client.sessionId, function(done) {
            if (done) {
                client.broadcast(createMessage(events.locked, coordinates));
            }
        });
    }

    function unlockHandler(coordinates) {
        map.unlock(coordinates[0], coordinates[1], client.sessionId, function(done) {
            if (done) {
                client.broadcast(createMessage(events.unlocked, coordinates));
            }
        });
    }

    function flipHandler(coordinates) {
        map.flip(coordinates[0][0], coordinates[0][1], coordinates[1][0], coordinates[1][1], client.sessionId, function(done) {
            if (done) {
                client.broadcast(createMessage(events.changed, coordinates));
            }
        });
    }
}

exports.handlers = handlers;