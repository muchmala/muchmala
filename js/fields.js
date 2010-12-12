BorbitPuzzle.fileld = function(settings) {
    settings = $.extend({
        viewport: null,
        piceSize: null,
        rectSize: null,
        indexCellSize: 60
    }, settings);

    var index = {};
    var pices = [];

    settings.viewport.click(function(event) {
        var offset = settings.viewport.offset();
        var eventX = event.clientX - offset.left;
        var eventY = event.clientY - offset.top;
        var found = checkIndexByCoordinates(eventX, eventY);
        
        for(var i in found) {
            if(found[i].hasPoint(eventX, eventY)) {
                found[i].select();
                break;
            }
        }
    });

    function addPice(pice) {
        pices.push(pice);
    }

    function build() {
        for(var i = 0, len = pices.length; i < len; i++) {
            settings.viewport.append(pices[i].build());
            pices[i].draw();
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
        var rectSize = settings.rectSize;
        var cellSize = settings.indexCellSize;

        for(var i = 0, len = pices.length; i < len; i++) {
            var pice = pices[i];
            var xCoord = pice.x ? pice.x * (rectSize + 1) : 0;
            var yCoord = pice.y ? pice.y * (rectSize + 1) : 0;
            var cellsCount = 1;
            
            if (piceSize > cellSize) {
                cellsCount += toInt(piceSize / cellSize);
            }

            for (var h = 0; h < cellsCount; h++) {
                for (var v = 0; v < cellsCount; v++) {
                    var xIndex = xCoord - (xCoord % cellSize) + (h * cellSize);
                    var yIndex = yCoord - (yCoord % cellSize) + (v * cellSize);

                    if (index[xIndex] == null) {
                        index[xIndex] = {};
                    }
                    if (index[xIndex][yIndex] == null) {
                        index[xIndex][yIndex] = [];
                    }
                    index[xIndex][yIndex].push(pice);
                }
            }
        }
    }

    return {
        build: build,
        addPice: addPice
    };
};