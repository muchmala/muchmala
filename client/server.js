BorbitPuzzle.server = function server() {
    var socket = new io.Socket('io.puzzle.home', {
        port: 9999
    });
    socket.connect();

    var observer = BorbitUtils.Observer();
    observer.register(server.events.map);
    observer.register(server.events.locked);
    observer.register(server.events.unlocked);
    observer.register(server.events.changed);

    socket.on('message', function(data) {
        var parsed = JSON.parse(data);
        if(parsed.event != null &&
           observer.isRegistered(parsed.event)) {
           console.log(parsed.event);
            observer.fire(parsed.event, parsed.data);
        }
    });

    function sendMessage(message) {
        if(socket.connected) {
            console.log(message);
            socket.send(message);
        } else {
            throw 'Socket is not connected';
        }
    }

    function createMessage(action, data) {
        return JSON.stringify({action: action, data: data});
    }

    function lock(x, y) {
        sendMessage(createMessage('lock', [x, y]));
    }

    function unlock(x, y) {
        sendMessage(createMessage('unlock', [x, y]));
    }

    function change(x1, y1, x2, y2) {
        sendMessage(createMessage('change', [[x1, y1], [x2, y2]]));
    }

    return {
        lock: lock,
        unlock: unlock,
        change: change,
        subscribe: observer.subscribe,
        unsubscribe: observer.unsubscribe
    };
};

BorbitPuzzle.server.events = {
    map: 'map',
    locked: 'locked',
    unlocked: 'unlocked',
    changed: 'changed'
};