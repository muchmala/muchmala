BorbitPuzzle.fileld = function(settings) {
    settings = $.extend({
        viewport: null,
        piceSize: null,
        indexCellSize: 60
    }, settings);

    // TMP
    settings.indexCellSize = toInt(settings.piceSize/3*2);

    var index = {};
    var pices = {};
    var selected = false;

    settings.viewport.click(function(event) {
        var offset = settings.viewport.offset();
        var eventX = event.clientX - offset.left;
        var eventY = event.clientY - offset.top;
        var found = checkIndexByCoordinates(eventX, eventY);
        
        for(var i in found) {
            if(found[i].hasPoint(eventX, eventY)) {
                onClick(found[i]);
                break;
            }
        }
    });

    function onClick(pice) {
        if(!selected || !selected.selected && !pice.selected) {
            pice.select();
            selected = pice;
        } else {
            if(isSameType(selected, pice)) {
                replacePices(selected, pice);
                selected.selected = false;
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

    function replacePices(first, second) {
        var tmpX = first.tx;
        var tmpY = first.ty;
        first.tx = second.tx;
        first.ty = second.ty;
        second.tx = tmpX;
        second.ty = tmpY;
        second.draw();
        first.draw();
    }

    function addPice(x, y, pice) {
        if(pices[y] == null) {
            pices[y] = {};
        }
        pices[y][x] = pice;
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
        addPice: addPice
    };
};