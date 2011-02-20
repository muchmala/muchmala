Puzzle.handlers = function(server, layout, panel) {

    var handlers = {
        connected: function() {
            server.initialize(1, Puzzle.storage.getUserId());
        },

        initialized: function() {
            server.getMap();
            server.getUserData();
        },
        
        map: function(data) {
            if(!imageSrc) {
                
                var image = new Image();
                image.src = '/img/' + data.name + '/pieces.png';
                image.onload = function() {
                    init(data);
                };
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
                field.getPice(coords[i][0], coords[i][1]).clear();
            }
        },

        pieceSelected: function(coords) {
            selected = field.getPice(coords[0], coords[1]);
            selected.select();
        },

        pieceUnselected: function(coords) {
            field.getPice(coords[0], coords[1]).clear();
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

    var field, pices, imageSrc, selected;
    var fieldEvents = Puzzle.Field.events;
    var panelEvents = Puzzle.Panel.events;
    var serverEvents = Puzzle.Server.events;

    for(var i in serverEvents) {
        if(serverEvents[i] in handlers) {
            server.subscribe(serverEvents[i], handlers[i]);
        }
    }

    panel.subscribe(panelEvents.userNameChanged, server.updateUserName);
    server.connect();
    layout.showLoading();

    function init(data) {
        field = Puzzle.Field({
            piceSize: data.piceSize,
            spriteSrc: '/img/' + data.name + '/pieces.png',
            defaultCoverSrc: '/img/' + data.name + '/default_covers.png',
            selectCoverSrc: '/img/' + data.name + '/select_covers.png',
            lockCoverSrc: '/img/' + data.name + '/lock_covers.png',
            viewport: layout.viewport
        });

        imageSrc = data.imageSrc;
        var step = toInt(data.piceSize / 6);
        var rectSize = step * 4 + 1;
        var vQnt = data.map[0].length;
        var hQnt = data.map.length;

        panel.setTimeSpent(data.created);

        field.subscribe(fieldEvents.clicked, processClickedPice);
        field.buildField(data.map);
        
        layout.arrange(vQnt*rectSize + step*2, hQnt*rectSize + step*2);
        layout.hideLoading();
    }
    
    function processClickedPice(pice) {
        if(!pice.locked && !pice.isCollected()) {
            if(pice.selected) {
                server.unselectPice(pice.x, pice.y);
            } else if(!selected || !selected.selected) {
                server.selectPice(pice.x, pice.y);
            } else {
                if(field.isSameType(selected, pice)) {
                    selected.clear();
                    server.flipPices(selected.x, selected.y, pice.x, pice.y);
                }
            }
        }
    }
};