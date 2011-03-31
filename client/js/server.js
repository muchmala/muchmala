Puzz.Server = (function() {
    var observer = Utils.Observer();
    var socket = new io.Socket();
    var m = MESSAGES;
    
    socket.on('message', function(data) {
        var parsed = JSON.parse(data);
        log('received ' + parsed.event);
        if(parsed.event != null) {
            observer.fire(parsed.event, parsed.data);
        }
    });

    socket.on('disconnect', function() {
        log('Disconnected');
        socket.connect();
    });
    
    socket.on('connect', function() {
        log('Connected');
        observer.fire('connected');
    });

    function sendMessage(message) {
        if(socket.connected) {
            log('sent ' + message);
            socket.send(message);
        }
    }

    function createMessage(action, data) {
        return JSON.stringify({action: action, data: data});
    }

    var publicInterface = {
        connect: function() {
            socket.connect();
        },
        disconnect: function() {
            socket.disconnect();
        },
        
        initialize: function(mapId, userId) {
            var data = {mapId: mapId};
            if(userId) {
                data.userId = userId
            }
            sendMessage(createMessage(m.initialize, data));
        },
        getPiecesData: function(puzzleId) {
            sendMessage(createMessage(m.piecesData, puzzleId));
        },
        getUserData: function(userId) {
            sendMessage(createMessage(m.userData, userId));
        },
        setUserName: function(userName) {
            sendMessage(createMessage(m.setUserName, userName));
        },
        lockPiece: function(x, y) {
            sendMessage(createMessage(m.lockPiece, [x, y]));
        },
        unlockPiece: function(x, y) {
            sendMessage(createMessage(m.unlockPieces, [[x, y]]));
        },
        selectPiece: function(x, y) {
            sendMessage(createMessage(m.selectPiece, [x, y]));
        },
        releasePiece: function(x, y) {
            sendMessage(createMessage(m.releasePiece, [x, y]));
        },
        swapPieces: function(x1, y1, x2, y2) {
            sendMessage(createMessage(m.swapPieces, [[x1, y1], [x2, y2]]));
        },
        getTopTwenty: function() {
            sendMessage(createMessage(m.topTwenty));
        }
    };

    return _.extend(publicInterface, observer);
})();

