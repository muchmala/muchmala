Puzzle.Server = function server() {
    var observer = Utils.Observer();
    var socket = new io.Socket('io.puzzle.home', {
        transports: ['websocket', 'flashsocket', 'xhr-multipart']
    });
    
    socket.on('message', function(data) {
        var parsed = JSON.parse(data);
        log('received ' + parsed.event);
        if(parsed.event != null) {
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

    function initialize(mapId, userId) {
        var data = {mapId: mapId};

        if(userId) {
            data.userId = userId
        }

        sendMessage(createMessage('initialize', data));
    }

    function getMap(mapId) {
        sendMessage(createMessage('map', mapId));
    }

    function getUserData(userId) {
        sendMessage(createMessage('user', userId));
    }

    function updateUserName(userName) {
        sendMessage(createMessage('updateUserName', userName));
    }

    function lockPice(x, y) {
        sendMessage(createMessage('lock', [x, y]));
    }

    function unlockPice(x, y) {
        sendMessage(createMessage('unlock', [x, y]));
    }

    function selectPice(x, y) {
        sendMessage(createMessage('select', [x, y]));
    }

    function unselectPice(x, y) {
        sendMessage(createMessage('unselect', [x, y]));
    }

    function flipPices(x1, y1, x2, y2) {
        sendMessage(createMessage('flip', [[x1, y1], [x2, y2]]));
    }

    return {
        connect: connect,
        getMap: getMap,
        lockPice: lockPice,
        unlockPice: unlockPice,
        selectPice: selectPice,
        unselectPice: unselectPice,
        flipPices: flipPices,
        initialize: initialize,
        getUserData: getUserData,
        updateUserName: updateUserName,
        subscribe: observer.subscribe
    };
};

Puzzle.Server.events = {
    map: 'map',
    user: 'user',
    connected: 'connected',
    initialized: 'initialized',
    pieceLocked: 'pieceLocked',
    pieceSelected: 'pieceSelected',
    piecesUnlocked: 'piecesUnlocked',
    pieceUnselected: 'pieceUnselected',
    piecesFlipped: 'piecesFlipped',
    completeLevel: 'completeLevel',
    leadersBoard: 'leadersBoard',
    connectedUsersCount: 'connectedUsersCount'
};