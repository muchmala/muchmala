Puzzle.Handlers = function(server, layout, panel) {

    var handlers = {};
    var field, selected;
    var preloader = new Puzzle.Preloader();

    server.connect();
    layout.showLoading();
    
    handlers.connected = function() {
        server.initialize(1, Puzzle.storage.getUserId());
    };

    handlers.initialized = function() {
        server.getMap();
        server.getUserData();
    };

    handlers.puzzle = function(data) {console.log(data);
        if(!field) {
            initialize(data);
        } else {
            field.updateField(data.map);
        }
    };

    handlers.user = function(data) {
        Puzzle.storage.setUserId(data.id);
        panel.setUsername(data.name);
        panel.setScore(data.currentScore);
        panel.show();
    };

    handlers.pieceLocked = function(coords) {
        field.getPice(coords[0], coords[1]).lock();
    };

    handlers.piecesUnlocked = function(coords) {
        for(var i = 0, len = coords.length; i < len; i++) {
            field.getPice(coords[i][0], coords[i][1]).unlock();
        }
    };

    handlers.pieceSelected = function(coords) {
        selected = field.getPice(coords[0], coords[1]);
        selected.select();
    };

    handlers.pieceUnselected = function(coords) {
        field.getPice(coords[0], coords[1]).unselect();
    };

    handlers.piecesFlipped = function(coord) {
        field.flipPicesByCoords(coord);
    };

    handlers.connectedUsersCount = function(count) {
        panel.setConnectedUsersCount(count);
    };

    handlers.completeLevel = function(percent) {
        panel.setCompleteLevel(percent);
    };

    handlers.leadersBoard = function(users) {
        panel.updateLeadersBoard(users);
    };

    _.each(Puzzle.Server.events, function(event) {
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
                piceSize: data.piceSize,
                viewport: layout.viewport
            }, images));

            panel.setTimeSpent(data.created);
            panel.subscribe(Puzzle.Panel.MESSAGES.userNameChanged, server.updateUserName);

            field.subscribe(Puzzle.Field.MESSAGES.clicked, processClickedPice);
            field.buildField(data.pieces);
            
            layout.arrange(data.piceSize, data.vLength, data.hLength);
            layout.hideLoading();
        });
    }
    
    function processClickedPice(pice) {
        if(!pice.locked && !pice.isCollected()) {
            if(pice.selected) {
                server.unselectPice(pice.x, pice.y);
            } else if(!selected || !selected.selected) {
                server.selectPice(pice.x, pice.y);
            } else {
                if(field.isSameType(selected, pice)) {
                    selected.unselect();
                    server.flipPices(selected.x, selected.y, pice.x, pice.y);
                }
            }
        }
    }
};