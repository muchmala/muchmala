BorbitPuzzle.server = function server() {
    var socket = new io.Socket('io.puzzle.home', {
        transports: ['websocket', 'flashsocket', 'xhr-multipart']
    });
    
    var observer = BorbitUtils.Observer();
    observer.register(server.events.map);
    observer.register(server.events.locked);
    observer.register(server.events.unlocked);
    observer.register(server.events.changed);
    observer.register(server.events.connected);
    
    socket.on('message', function(data) {
        var parsed = JSON.parse(data);
        if(parsed.event != null &&
           observer.isRegistered(parsed.event)) {
            log('received ' + parsed.event);
            observer.fire(parsed.event, parsed.data);
        }
    });

    socket.on('disconnect', connect);

    socket.on('connect', function() {
        observer.fire(server.events.connected);
    });

    function connect() {
        socket.connect();
    }

    function sendMessage(message) {
        if(socket.connected) {
            log('sent ' + message);
            socket.send(message);
        } else {
            log('Socket is not connected');
        }
    }

    function createMessage(action, data) {
        return JSON.stringify({action: action, data: data});
    }

    function map() {
        sendMessage(createMessage('map'));
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
        map: map,
        lock: lock,
        unlock: unlock,
        change: change,
        connect: connect,
        subscribe: observer.subscribe,
        unsubscribe: observer.unsubscribe
    };
};

BorbitPuzzle.server.events = {
    map: 'map',
    locked: 'locked',
    unlocked: 'unlocked',
    changed: 'changed',
    conncted: 'conncted'
};