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
            if(!image) {
                image = new Image();
                image.src = data.imageSrc;
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
        }
    };

    var field, pices, image, selected;
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
        field = Puzzle.FieldHelper(
            Puzzle.Field({
                piceSize: data.piceSize,
                viewport: layout.viewport
            }),
            Puzzle.Pices({
                piceSize: data.piceSize,
                image: image
            }));

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
        if(!pice.locked && !pice.onRightPlace) {
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