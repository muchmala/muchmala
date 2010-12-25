BorbitPuzzle.handlers = function(server, layout) {
    var field, pices, selected, image, countDown;
    var fieldEvents = BorbitPuzzle.field.events;
    var serverEvents = BorbitPuzzle.server.events;

    server.subscribe(serverEvents.map, processMap);
    server.subscribe(serverEvents.locked, lockPice);
    server.subscribe(serverEvents.unlocked, unlockPices);
    server.subscribe(serverEvents.flipped, flipPicesByCoords);
    server.subscribe(serverEvents.connected, getMap);

    server.connect();
    layout.showLoading();

    function init(data) {
        field = BorbitPuzzle.field({
            piceSize: data.piceSize,
            viewport: layout.viewport
        });

        pices = BorbitPuzzle.pices({
            piceSize: data.piceSize,
            image: image
        });

        var step = toInt(data.piceSize / 6);
        var rectSize = step * 4 + 1;
        var vQnt = data.map[0].length;
        var hQnt = data.map.length;

        field.subscribe(fieldEvents.clicked, processClickedPice);
        layout.arrange(vQnt*rectSize + step*2, hQnt*rectSize + step*2);
        buildField(data.map);
        layout.hideLoading();
    }

    function getMap() {
        server.map(1);
    }

    function processMap(data) {
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

    function buildField(map) {
        for(var y = 0, rLen = map.length; y < rLen; y++) {
            for(var x = 0, cLen = map[y].length; x < cLen; x++) {
                var cell = map[y][x];
                var pice = pices.factory({
                    x: x, y: y, 
                    realX: cell.x,
                    realY: cell.y,
                    locked: cell.d,
                    ears: {
                        left: cell.l, bottom: cell.b,
                        right: cell.r, top: cell.t
                    }
                });
                field.addPice(x, y, pice);
            }
        }
        field.build();
        log('field is built');
    }

    function updateField(map) {
        for(var y = 0, rLen = map.length; y < rLen; y++) {
            for(var x = 0, cLen = map[y].length; x < cLen; x++) {
                var cell = map[y][x];
                var pice = field.getPice(x, y);

                if(pice.selected) {
                    pice.unselect();
                }

                if(pice.realX != cell.x || pice.realY != cell.y) {
                    pice.realX = cell.x;
                    pice.realY = cell.y;
                    pice.draw();
                }
            }
        }
        log('field is updated');
    }

    function lockPice(coords) {
        field.getPice(coords[0], coords[1]).lock();
    }

    function unlockPice(coords) {
        field.getPice(coords[0], coords[1]).unlock();
    }

    function unlockPices(coords) {
        for(var i = 0, len = coords.length; i < len; i++) {
            unlockPice(coords[i]);
        }
    }
    
    function processClickedPice(pice) {
        if(!pice.locked) {
            if(pice.selected) {
                unselect(pice);
                stopCountDown();
            } else if(!selected || !selected.selected) {
                select(pice);
                startCountDown();
            } else {
                if(isSameType(selected, pice)) {
                    flipSelectedWith(pice);
                    stopCountDown();
                }
            }
        }
    }

    function startCountDown() {
        countDown = setTimeout(function() {
            unselect(selected);
        }, 20000);
    }

    function stopCountDown() {
        clearTimeout(countDown);
    }

    function isSameType(first, second) {
        if(first.ears.left == second.ears.left &&
           first.ears.bottom == second.ears.bottom &&
           first.ears.right == second.ears.right &&
           first.ears.top == second.ears.top) {
            return true;
        }
        return false;
    }

    function select(pice) {
        pice.select();
        selected = pice;
        server.lock(pice.x, pice.y);
    }

    function unselect(pice) {
        pice.unselect();
        server.unlock(pice.x, pice.y);
    }

    function flipPices(first, second) {
        var tmpX = first.realX;
        var tmpY = first.realY;
        first.realX = second.realX;
        first.realY = second.realY;
        second.realX = tmpX;
        second.realY = tmpY;
        second.draw();
        first.draw();
        first.unselect();
    }

    function flipSelectedWith(pice) {
        flipPices(selected, pice);
        server.flip(selected.x, selected.y, pice.x, pice.y);
    }

    function flipPicesByCoords(coords) {
        var first = field.getPice(coords[0][0], coords[0][1]);
        var second = field.getPice(coords[1][0], coords[1][1]);
        first.unlock();
        second.unlock();
        flipPices(first, second);
    }

};