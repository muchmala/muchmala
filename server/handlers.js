var models = require('./models');

function getHandlers(client, map) {
    var actions = {
        lock: lock,
        unlock: unlock,
        change: change
    };

    var events = {
        map: 'map',
        locked: 'locked',
        unlocked: 'unlocked',
        changed: 'changed'
    };

    client.on('message', function(data) {
        process(JSON.parse(data));
        console.log(config.qwe);
    });

    client.on('disconnect', function() {

    });

    client.send(createMessage(events.map, {
        imageSrc: 'lost.jpg',
        piceSize: 90,
        map: map
    }));

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

    function lock(coordinates) {
        client.broadcast(createMessage(events.locked, coordinates));
    }

    function unlock(coordinates) {
        client.broadcast(createMessage(events.unlocked, coordinates));
    }

    function change(coordinates) {
        client.broadcast(createMessage(events.changed, coordinates));
    }
}

exports.getHandlers = getHandlers;