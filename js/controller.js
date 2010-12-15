BorbitPuzzle.controller = function(server, settings) {
    var field, pices, selected;
    var fieldEvents = BorbitPuzzle.field.events;
    var serverEvents = BorbitPuzzle.server.events;
    server.subscribe(serverEvents.map, init);
    server.subscribe(serverEvents.locked, lockPice);
    server.subscribe(serverEvents.unlocked, unlockPice);
    server.subscribe(serverEvents.changed, changedPicesByCoords);

    function init(data) {
        field = BorbitPuzzle.field({
            piceSize: data.piceSize,
            viewport: settings.viewport
        });

        pices = BorbitPuzzle.pices({
            piceSize: data.piceSize,
            image: settings.image
        });

        field.subscribe(fieldEvents.clicked, processClickedPice);
        
        buildField(data.map);
    }

    function buildField(map) {
        for(var y = 0, rLen = map.length; y < rLen; y++) {
            for(var x = 0, cLen = map[y].length; x < cLen; x++) {
                var cell = map[y][x];
                var pice = pices.factory({
                    x: x, y: y,
                    l: cell.l, b: cell.b,
                    r: cell.r, t: cell.t,
                    tx: cell.x, ty: cell.y
                });
                field.addPice(x, y, pice);
            }
        }
        field.build();
    }

    function lockPice(coords) {
        var pice = field.getPice(coords[0], coords[1]);
        if(pice) {
            pice.lock();
        }
    }

    function unlockPice(coords) {
        var pice = field.getPice(coords[0], coords[1]);
        if(pice) {
            pice.unlock();
        }
    }
    
    function processClickedPice(pice) {
        if(!pice.locked) {
            if(pice.selected) {
                pice.unselect();
                server.unlock(pice.x, pice.y);
            } else if(!selected || !selected.selected) {
                pice.select();
                selected = pice;
                server.lock(pice.x, pice.y);
            } else {
                if(isSameType(selected, pice)) {
                    changePices(selected, pice);
                    server.change(selected.x, selected.y, pice.x, pice.y);
                    selected.unselect();
                }
            }
        }
    }

    function isSameType(first, second) {
        if(first.l == second.l && first.b == second.b &&
           first.r == second.r && first.t == second.t) {
            return true;
        }
        return false;
    }

    function changePices(first, second) {
        var tmpX = first.tx;
        var tmpY = first.ty;
        first.tx = second.tx;
        first.ty = second.ty;
        second.tx = tmpX;
        second.ty = tmpY;
        second.draw();
        first.draw();
    }

    function changedPicesByCoords(coords) {
        changePices(field.getPice(coords[0][0], coords[0][1]),
                    field.getPice(coords[1][0], coords[1][1]));
    }

};