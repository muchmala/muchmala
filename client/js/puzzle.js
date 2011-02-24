Puzzle.Field = function field(settings) {
    settings = $.extend({
        viewport: null,
        piceSize: null,
        indexCellSize: 60
    }, settings);

    Puzzle.Pice.setImages({
        spriteSrc: settings.spriteSrc,
        defaultCoverSrc: settings.defaultCoverSrc,
        selectCoverSrc: settings.selectCoverSrc,
        lockCoverSrc: settings.lockCoverSrc
    });

    // TMP
    settings.indexCellSize = Math.floor(settings.piceSize/3*2);

    var index = {};
    var pices = {};
    var observer = Utils.Observer();

    settings.viewport.click(function(event) {
        var offset = settings.viewport.offset();
        var eventX = event.clientX - offset.left;
        var eventY = event.clientY - offset.top;
        var found = checkIndexByCoordinates(eventX, eventY);
        
        _.each(found, function(piece) {
            if(piece.hasPoint(eventX, eventY)) {
                observer.fire(field.MESSAGES.clicked, piece);
            }
        });
    });

    function checkIndexByCoordinates(x, y) {
        var xIndex = x - (x % settings.indexCellSize);
        var yIndex = y - (y % settings.indexCellSize);
        
        if (!_.isUndefined(index[xIndex]) &&
            !_.isUndefined(index[xIndex][yIndex])) {
            return index[xIndex][yIndex];
        }

        return false;
    }

    function buildIndex() {
        var piceSize = settings.piceSize;
        var cellSize = settings.indexCellSize;

        _.each(pices, function(row) {
            _.each(row, function(pice) {

            var cellsCount = 1;
            
            if (piceSize > cellSize) {
                cellsCount += Math.floor(piceSize / cellSize);
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
            });
        });
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
        second.render();
        first.render();
    }

    function flipPicesByCoords(coords) {
        var first = getPice(coords[0][0], coords[0][1]);
        var second = getPice(coords[1][0], coords[1][1]);
        flipPices(first, second);
    }

    function addPice(data) {
        var pice = new Puzzle.Pice({
            ears: {
                left: data.l, bottom: data.b,
                right: data.r, top: data.t
            },
            x: data.x, 
            y: data.y,
            locked: data.d,
            realX: data.realX,
            realY: data.realY,
            size: settings.piceSize
        });

        settings.viewport.append(pice.element);

        if(pices[data.y] == null) {
            pices[data.y] = {};
        }
        pices[data.y][data.x] = pice;
    }

    function getPice(x, y) {
        if(!_.isUndefined(pices[y]) && !_.isUndefined(pices[y][x])) {
            return pices[y][x];
        }
        return false;
    }

    function buildField(piecesData) {
        _.each(piecesData, function(pieceData) {
            addPice(pieceData);
        });
        
        buildIndex();
    }

    function updateField(map) {
        _.each(map, function(row, y) {
            _.each(row, function(piceData, x) {
                var pice = getPice(x, y);
                pice.locked = piceData.d;
                pice.realX = piceData.x;
                pice.realY = piceData.y;
                pice.render();
            });
        });
        
        log('field is updated');
    }

    return {
        getPice: getPice,
        buildField: buildField,
        updateField: updateField,
        isSameType: isSameType,
        flipPices: flipPices,
        flipPicesByCoords: flipPicesByCoords,
        subscribe: observer.subscribe
    };
};

Puzzle.Field.MESSAGES = {
    clicked: 'clicked'
};