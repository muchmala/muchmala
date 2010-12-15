function controller(client, map) {
    client.on('message', function(data) {
        process(JSON.parse(data));
    });

    client.on('disconnect', function() {
        
    });

    client.send(createMessage(controller.events.map, {map: map, piceSize: 90}));

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
        client.broadcast(createMessage(controller.events.locked, coordinates));
    }

    function unlock(coordinates) {
        client.broadcast(createMessage(controller.events.unlocked, coordinates));
    }

    function change(coordinates) {
        client.broadcast(createMessage(controller.events.changed, coordinates));
    }

    var actions = {
        lock: lock,
        unlock: unlock,
        change: change
    };
}

controller.events = {
    map: 'map',
    locked: 'locked',
    unlocked: 'unlocked',
    changed: 'changed'
};

exports.controller = controller;