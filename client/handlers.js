Puzzle.handlers = function(server, layout, panel) {
    var field, pices, image, selected, countDown;
    var fieldEvents = Puzzle.Field.events;
    var panelEvents = Puzzle.Panel.events;
    var serverEvents = Puzzle.Server.events;

    server.subscribe(serverEvents.map, mapHandler);
    server.subscribe(serverEvents.user, userHandler);
    server.subscribe(serverEvents.locked, lockedHandler);
    server.subscribe(serverEvents.unlocked, unlockedHandler);
    server.subscribe(serverEvents.selected, selectedHandler);
    server.subscribe(serverEvents.unselected, unselectedHandler);
    server.subscribe(serverEvents.connected, connectedHandler);
    server.subscribe(serverEvents.flipped, flippedHandler);

    panel.subscribe(panelEvents.userNameChanged, server.updateUserName);

    server.connect();
    layout.showLoading();

    function mapHandler(data) {
        if(!image) {
            image = new Image();
            image.src = data.imageSrc;
            image.onload = function() {
                init(data);
            };
        } else {
            updateField(data.map);
        }
    }

    function userHandler(data) {
        Puzzle.storage.setUserId(data.id);
        panel.setUsername(data.name);
        panel.setScore(data.score);
    }

    function lockedHandler(coords) {
        field.getPice(coords[0], coords[1]).lock();
    }

    function unlockedHandler(coords) {
        for(var i = 0, len = coords.length; i < len; i++) {
            field.getPice(coords[i][0], coords[i][1]).unlock();
        }
    }

    function selectedHandler(coords) {
        startCountDown();
        selected = field.getPice(coords[0], coords[1]);
        selected.select();
    }

    function unselectedHandler(coords) {
        stopCountDown();
        field.getPice(coords[0], coords[1]).unselect();
    }

    function connectedHandler() {
        var userId = Puzzle.storage.getUserId();
        var mapId = 1;
        server.getMap(mapId);
        server.getUserData(userId);
    }

    function flippedHandler(coord) {
        field.flipPicesByCoords(coord);
    }

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

        field.subscribe(fieldEvents.clicked, processClickedPice);
        field.buildField(data.map);
        
        layout.arrange(vQnt*rectSize + step*2, hQnt*rectSize + step*2);
        layout.hideLoading();
    }
    
    function processClickedPice(pice) {
        if(!pice.locked) {
            if(pice.selected) {
                server.unselectPice(pice.x, pice.y);
            } else if(!selected || !selected.selected) {
                server.selectPice(pice.x, pice.y);
            } else {
                if(field.isSameType(selected, pice)) {
                    flipSelectedWith(pice);
                    stopCountDown();
                    server.flipPices(selected.x, selected.y, pice.x, pice.y);
                }
            }
        }
    }

    function flipSelectedWith(pice) {
        field.flipPices(selected, pice);
    }

    function startCountDown() {
        countDown = setTimeout(function() {
            server.unselectPice(selected.x, selected.y);
        }, 20000);
    }

    function stopCountDown() {
        clearTimeout(countDown);
    }
};