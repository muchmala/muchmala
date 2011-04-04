Puzz.Puzzle = function puzzle(settings) {
    settings = $.extend({
        viewport: null,
        pieceSize: null,
        indexCellSize: 60
    }, settings);

    Puzz.Piece.setImages({
        sprite: settings.sprite,
        defaultCover: settings.defaultCover,
        selectCover: settings.selectCover,
        lockCover: settings.lockCover
    });

    // TMP
    settings.indexCellSize = Math.floor(settings.pieceSize/3*2);

    var index = {};
    var pieces = {};
    var observer = Utils.Observer();
    var events = puzzle.EVENTS;
    var overed = null;

    settings.viewport.get(0).addEventListener('click', function(event) {
        var found = findPieces(event.clientX, event.clientY);
        _.each(found, function(piece) {
            observer.fire(events.leftClicked, piece);
        });
    }, false);
    
    /*settings.viewport.click(function(event) {
        var found = findPieces(event.clientX, event.clientY);
        _.each(found, function(piece) {
            observer.fire(events.leftClicked, piece);
        });
    });*/

    settings.viewport.bind('contextmenu', function(event) {
        observer.fire(events.rightClicked);
        event.preventDefault();
        event.stopPropagation();
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
        var pieceSize = settings.pieceSize;
        var cellSize = settings.indexCellSize;

        _.each(pieces, function(row) {
            _.each(row, function(piece) {

            var cellsCount = 1;
            
            if (pieceSize > cellSize) {
                cellsCount += Math.floor(pieceSize / cellSize);
            }

            for (var h = 0; h < cellsCount; h++) {
                var xIndex = piece.xCoord - (piece.xCoord % cellSize) + (h * cellSize);

                if (index[xIndex] == null) {
                    index[xIndex] = {};
                }

                for (var v = 0; v < cellsCount; v++) {
                    var yIndex = piece.yCoord - (piece.yCoord % cellSize) + (v * cellSize);

                    if (index[xIndex][yIndex] == null) {
                        index[xIndex][yIndex] = [];
                    }
                    
                    index[xIndex][yIndex].push(piece);
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
        var piece = new Puzz.Piece({
            ears: {
                left: data.l, bottom: data.b,
                right: data.r, top: data.t
            },
            x: data.x, 
            y: data.y,
            locked: data.d,
            realX: data.realX,
            realY: data.realY,
            size: settings.pieceSize
        });

        settings.viewport.append(piece.element);

        if(pieces[data.y] == null) {
            pieces[data.y] = {};
        }
        pieces[data.y][data.x] = piece;
    }

    function getPiece(x, y) {
        if(!_.isUndefined(pieces[y]) && !_.isUndefined(pieces[y][x])) {
            return pieces[y][x];
        }
        return false;
    }

    function build(piecesData) {
        _.each(piecesData, function(pieceData) {
            addPiece(pieceData);
        });
        buildIndex();
    }

    function update(piecesData) {
        _.each(piecesData, function(pieceData) {
            var piece = getPiece(pieceData.x, pieceData.y);
            piece.selected = false;
            piece.locked = pieceData.d;
            piece.realX = pieceData.realX;
            piece.realY = pieceData.realY;
            piece.render();
        });
    }

    return {
        // Properties
        events: events,
        // Methods
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
    leftClicked: 'leftClicked',
    rightClicked: 'rightClicked'
};