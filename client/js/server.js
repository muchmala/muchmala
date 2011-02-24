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
        observer.fire('connected');
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
        sendMessage(createMessage(MESSAGES.initialize, data));
    }
    function getPuzzle(puzzleId) {
        sendMessage(createMessage(MESSAGES.puzzleData, puzzleId));
    }
    function getUserData(userId) {
        sendMessage(createMessage(MESSAGES.userData, userId));
    }
    function updateUserName(userName) {
        sendMessage(createMessage(MESSAGES.updateUserName, userName));
    }
    function lockPiece(x, y) {
        sendMessage(createMessage(MESSAGES.lockPiece, [x, y]));
    }
    function unlockPiece(x, y) {
        sendMessage(createMessage(MESSAGES.unlockPieces, [[x, y]]));
    }
    function selectPiece(x, y) {
        sendMessage(createMessage(MESSAGES.selectPiece, [x, y]));
    }
    function releasePiece(x, y) {
        sendMessage(createMessage(MESSAGES.releasePiece, [x, y]));
    }
    function swapPieces(x1, y1, x2, y2) {
        sendMessage(createMessage(MESSAGES.swapPieces, [[x1, y1], [x2, y2]]));
    }

    return {
        connect: connect,
        initialize: initialize,
        getPuzzle: getPuzzle,
        lockPiece: lockPiece,
        unlockPiece: unlockPiece,
        selectPiece: selectPiece,
        releasePiece: releasePiece,
        swapPieces: swapPieces,
        getUserData: getUserData,
        updateUserName: updateUserName,
        subscribe: observer.subscribe
    };
};