Puzzle.Field = function field(settings) {
    settings = $.extend({
        viewport: null,
        piceSize: null,
        indexCellSize: 60
    }, settings);

    // TMP
    settings.indexCellSize = toInt(settings.piceSize/3*2);

    var index = {};
    var pices = {};
    var observer = Utils.Observer();

    settings.viewport.click(function(event) {
        var offset = settings.viewport.offset();
        var eventX = event.clientX - offset.left;
        var eventY = event.clientY - offset.top;
        var found = checkIndexByCoordinates(eventX, eventY);
        
        for(var i in found) {
            if(found[i].hasPoint(eventX, eventY)) {
                observer.fire(field.events.clicked, found[i]);
                break;
            }
        }
    });

    function addPice(x, y, data) {
        if(pices[y] == null) {
            pices[y] = {};
        }

        pices[y][x] = new Puzzle.Pice({
            x: x, y: y,
            ears: {
                left: data.l, bottom: data.b,
                right: data.r, top: data.t
            },
            locked: data.d,
            realX: data.x,
            realY: data.y,
            size: settings.piceSize,
            imageSrc: settings.imageSrc
        });
    }

    function getPice(x, y) {
        if(pices[y] != null && pices[y][x] != null) {
            return pices[y][x];
        }
        return false;
    }

    function build() {
        for(var y in pices) {
            for(var x in pices[y]) {
                settings.viewport.append(pices[y][x].build());
            }
        }
        
        buildIndex();
    }

    function checkIndexByCoordinates(x, y) {
        var xIndex = x - (x % settings.indexCellSize);
        var yIndex = y - (y % settings.indexCellSize);
        
        if (index[xIndex] != undefined &&
            index[xIndex][yIndex] != undefined) {
            return index[xIndex][yIndex];
        }

        return false;
    }

    function buildIndex() {
        var piceSize = settings.piceSize;
        var cellSize = settings.indexCellSize;

        for(var y in pices) {
        for(var x in pices[y]) {

            var pice = pices[y][x];
            var cellsCount = 1;
            
            if (piceSize > cellSize) {
                cellsCount += toInt(piceSize / cellSize);
            }

            for (var h = 0; h < cellsCount; h++) {
                var xIndex = pice.xCoord - (pice.xCoord % cellSize) + (h * cellSize);

                if (index[xIndex] == null) {
                    index[xIndex] = {};
                }

                for (var v = 0; v < cellsCount; v++) {
                    var yIndex = pice.yCoord - (pice.yCoord % cellSize) + (v * cellSize);

                    if (index[xIndex][yIndex] == null) {
                        index[xIndex][yIndex] = [];
                    }
                    
                    index[xIndex][yIndex].push(pice);
                }
            }
        }}
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

    function flipPicesByCoords(coords) {
        var first = getPice(coords[0][0], coords[0][1]);
        var second = getPice(coords[1][0], coords[1][1]);
        first.unlock();
        second.unlock();
        flipPices(first, second);
    }

    function buildField(map) {
        for(var y = 0, rLen = map.length; y < rLen; y++) {
            for(var x = 0, cLen = map[y].length; x < cLen; x++) {
                addPice(x, y, map[y][x]);
            }
        }
        build();
        log('field is built');
    }

    function updateField(map) {
        for(var y = 0, rLen = map.length; y < rLen; y++) {
            for(var x = 0, cLen = map[y].length; x < cLen; x++) {
                var cell = map[y][x];
                var pice = getPice(x, y);

                if(pice.selected) {
                    pice.select();
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

    return {
        build: build,
        buildField: buildField,
        getPice: getPice,
        subscribe: observer.subscribe
    };
};

Puzzle.Field.events = {
    clicked: 'clicked'
};