BorbitPuzzle.field = function field(settings) {
    settings = $.extend({
        viewport: null,
        piceSize: null,
        indexCellSize: 60
    }, settings);

    // TMP
    settings.indexCellSize = toInt(settings.piceSize/3*2);

    var index = {};
    var pices = {};
    var observer = BorbitUtils.Observer();
    observer.register(field.events.clicked);

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

    function addPice(x, y, pice) {
        if(pices[y] == null) {
            pices[y] = {};
        }
        pices[y][x] = pice;
    }

    function getPice(x, y) {
        if(pices[y] != null && pices[y][x] != null) {
            return pices[y][x];
        }
        return false;
    }

    function build() {
        var rectSize = toInt(settings.piceSize / 3 * 2);
        
        for(var y in pices) {
            for(var x in pices[y]) {
                pices[y][x].xCoord = x * (rectSize + 1);
                pices[y][x].yCoord = y * (rectSize + 1);
                pices[y][x].build();
                pices[y][x].draw();
                settings.viewport.append(pices[y][x].canvas);
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

    return {
        build: build,
        addPice: addPice,
        getPice: getPice,
        subscribe: observer.subscribe,
        unsubscribe: observer.unsubscribe
    };
};

BorbitPuzzle.field.events = {
    clicked: 'clicked'
};