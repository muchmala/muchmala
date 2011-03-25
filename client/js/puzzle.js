Puzz.Puzzle = function puzzle(settings) {
    settings = $.extend({
        viewport: null,
        piceSize: null,
        indexCellSize: 60
    }, settings);

    Puzz.Piece.setImages({
        sprite: settings.sprite,
        defaultCover: settings.defaultCover,
        selectCover: settings.selectCover,
        lockCover: settings.lockCover
    });

    // TMP
    settings.indexCellSize = Math.floor(settings.piceSize/3*2);

    var index = {};
    var pices = {};
    var observer = Utils.Observer();
    var overed = null;

    settings.viewport.click(function(event) {
        var found = findPieces(event.clientX, event.clientY);
        _.each(found, function(piece) {
            observer.fire(puzzle.EVENTS.clicked, piece);
        });
    });

    settings.viewport.mousemove(function(event) {
        if(overed) {
            overed.unhighlight();
        }
        var found = findPieces(event.clientX, event.clientY);
        _.each(found, function(piece) {
            piece.highlight();
            overed = piece;
        });
    });

    function findPieces(clientX, clientY) {
        var offset = settings.viewport.offset();
        var eventX = clientX - offset.left;
        var eventY = clientY - offset.top;
        var found = checkIndexByCoordinates(eventX, eventY);

        return _.select(found, function(piece) {
            return piece.hasPoint(eventX, eventY);
        });
    }

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

    function flipPieces(first, second) {
        var tmpX = first.realX;
        var tmpY = first.realY;
        first.realX = second.realX;
        first.realY = second.realY;
        second.realX = tmpX;
        second.realY = tmpY;
        second.render();
        first.render();
    }

    function flipPiecesByCoords(coords) {
        var first = getPiece(coords[0][0], coords[0][1]);
        var second = getPiece(coords[1][0], coords[1][1]);
        flipPieces(first, second);
    }

    function addPiece(data) {
        var pice = new Puzz.Piece({
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

    function getPiece(x, y) {
        if(!_.isUndefined(pices[y]) && !_.isUndefined(pices[y][x])) {
            return pices[y][x];
        }
        return false;
    }

    function build(piecesData) {
        _.each(piecesData, function(pieceData) {
            addPiece(pieceData);
        });
        
        buildIndex();
    }

    function update(map) {
        _.each(map, function(row, y) {
            _.each(row, function(piceData, x) {
                var pice = getPiece(x, y);
                pice.locked = piceData.d;
                pice.realX = piceData.x;
                pice.realY = piceData.y;
                pice.render();
            });
        });
        
        log('puzzle is updated');
    }

    return {
        build: build,
        update: update,
        getPiece: getPiece,
        isSameType: isSameType,
        flipPieces: flipPieces,
        flipPiecesByCoords: flipPiecesByCoords,
        subscribe: observer.subscribe
    };
};

Puzz.Puzzle.EVENTS = {
    clicked: 'clicked'
};