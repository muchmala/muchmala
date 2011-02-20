Puzzle.Handlers = function(server, layout, panel) {

    var handlers = {
        connected: function() {
            server.initialize(1, Puzzle.storage.getUserId());
        },

        initialized: function() {
            server.getMap();
            server.getUserData();
        },

        map: function(data) {
            if(!field) {
                init(data);
            } else {
                field.updateField(data.map);
            }
        },

        user: function(data) {
            Puzzle.storage.setUserId(data.id);
            panel.setUsername(data.name);
            panel.setScore(data.currentScore);
            panel.show();
        },

        pieceLocked: function(coords) {
            field.getPice(coords[0], coords[1]).lock();
        },

        piecesUnlocked: function(coords) {
            for(var i = 0, len = coords.length; i < len; i++) {
                field.getPice(coords[i][0], coords[i][1]).unlock();
            }
        },

        pieceSelected: function(coords) {
            selected = field.getPice(coords[0], coords[1]);
            selected.select();
        },

        pieceUnselected: function(coords) {
            field.getPice(coords[0], coords[1]).unselect();
        },

        piecesFlipped: function(coord) {
            field.flipPicesByCoords(coord);
        },

        connectedUsersCount: function(count) {
            panel.setConnectedUsersCount(count);
        },

        completeLevel: function(percent) {
            panel.setCompleteLevel(percent);
        },

        leadersBoard: function(users) {
            panel.updateLeadersBoard(users);
        }
    };

    var field, pices, selected;
    var fieldEvents = Puzzle.Field.events;
    var panelEvents = Puzzle.Panel.events;
    var serverEvents = Puzzle.Server.events;
    var preloader = new Puzzle.Preloader();

    for(var i in serverEvents) {
        if(serverEvents[i] in handlers) {
            server.subscribe(serverEvents[i], handlers[i]);
        }
    }

    panel.subscribe(panelEvents.userNameChanged, server.updateUserName);
    server.connect();
    layout.showLoading();

    function init(data) {
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

            field.subscribe(fieldEvents.clicked, processClickedPice);
            field.buildField(data.map);
            
            layout.arrange(data.piceSize, data.map.length, data.map[0].length);
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