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
        change: changeHandler
    };

    var locked = null;

    client.on('message', function(data) {
        process(JSON.parse(data));
    });

    client.on('disconnect', function() {
        if(locked != null) {
            unlockHandler(locked);
        }
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
        client.send(createMessage(events.map, {
            imageSrc: 'images/lost.jpg',
            piceSize: 90,
            map: map
        }));
    }

    function lockHandler(coordinates) {
        locked = coordinates;
        client.broadcast(createMessage(events.locked, coordinates));
    }

    function unlockHandler(coordinates) {
        locked = null;
        client.broadcast(createMessage(events.unlocked, coordinates));
    }

    function changeHandler(coordinates) {
        client.broadcast(createMessage(events.changed, coordinates));
    }
}

exports.handlers = handlers;