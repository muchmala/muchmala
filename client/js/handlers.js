Puzzle.Handlers = function(server, layout, panel) {
    var handlers = {};
    var field, selected;
    var preloader = new Puzzle.Preloader();

    server.connect();
    layout.showLoading();

    handlers.puzzleData = function(data) {
        if(!field) {
            initialize(data);
        } else {
            field.updateField(data.map);
        }
    };

    handlers.userData = function(data) {
        Puzzle.storage.setUserId(data.id);
        panel.setScore(data.puzzleScore);
        panel.setUsername(data.name);
        panel.show();
    };

    handlers.lockPiece = function(coords) {
        field.getPice(coords[0], coords[1]).lock();
    };

    handlers.unlockPieces = function(coords) {
        for(var i = 0, len = coords.length; i < len; i++) {
            field.getPice(coords[i][0], coords[i][1]).unlock();
        }
    };

    handlers.selectPiece = function(coords) {
        selected = field.getPice(coords[0], coords[1]);
        selected.select();
    };

    handlers.releasePiece = function(coords) {
        field.getPice(coords[0], coords[1]).unselect();
    };

    handlers.swapPieces = function(coord) {
        field.flipPicesByCoords(coord);
    };

    handlers.connectedUsersCount = function(count) {
        panel.setConnectedUsersCount(count);
    };

    handlers.completionPercentage = function(percent) {
        panel.setCompleteLevel(percent);
    };

    handlers.leadersBoard = function(data) {
        panel.updateLeadersBoard(data);
    };

    handlers.connected = function(users) {
        panel.updateLeadersBoard(users);
    };

    server.subscribe('connected', function() {
        server.initialize(1, Puzzle.storage.getUserId());
    });

    _.each(MESSAGES, function(event) {
        if(event in handlers) {
            server.subscribe(event, handlers[event]);
        }
    });

    function initialize(data) {
        var images = {
            spriteSrc: '/img/' + data.name + '/pieces.png',
            defaultCoverSrc: '/img/' + data.name + '/default_covers.png',
            selectCoverSrc: '/img/' + data.name + '/select_covers.png',
            lockCoverSrc: '/img/' + data.name + '/lock_covers.png'
        };

        preloader.loadImages(images, function() {
            field = Puzzle.Field(_.extend({
                piceSize: data.pieceSize,
                viewport: layout.viewport
            }, images));

            panel.setTimeSpent(data.created);
            panel.setCompleteLevel(data.completion);
            panel.setConnectedUsersCount(data.connected);
            panel.subscribe(Puzzle.Panel.MESSAGES.userNameChanged, server.setUserName);
            field.subscribe(Puzzle.Field.MESSAGES.clicked, processClickedPice);
            field.buildField(data.pieces);
            
            layout.arrange(data.pieceSize, data.vLength, data.hLength);
            layout.hideLoading();
        });
    }
    
    function processClickedPice(piece) {
        if(!piece.locked && !piece.isCollected()) {
            if(piece.selected) {
                server.releasePiece(piece.x, piece.y);
            } else if(!selected || !selected.selected) {
                server.selectPiece(piece.x, piece.y);
            } else {
                if(field.isSameType(selected, piece)) {
                    selected.unselect();
                    server.swapPieces(selected.x, selected.y, piece.x, piece.y);
                }
            }
        }
    }
};