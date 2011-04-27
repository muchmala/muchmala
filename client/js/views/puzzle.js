(function() {

function Puzzle(model, viewport) {
    Puzzle.superproto.constructor.call(this);
    
    this.index = {};
    this.pieces = {};
    this.model = model;
    this.indexCellSize = 0;
    this.viewport = viewport;
    
    this.model.once('change', _.bind(function() {
        this.indexCellSize = Math.floor(model.get('pieceSize') / 3 * 2);
    }, this));
    
    this.viewport.click(_.bind(function(event) {
        var found = this.findPieces(event.clientX, event.clientY);
        this.fire(this.EVENTS.leftClicked, found[0]);
    }, this));

    this.viewport.bind('contextmenu', _.bind(function(event) {
        this.fire(this.EVENTS.rightClicked);
        event.preventDefault();
        event.stopPropagation();
    }, this));

    var overed = null;
    this.viewport.mousemove(_.bind(function(event) {
        if(overed) { overed.unhighlight(); }
        var found = this.findPieces(event.clientX, event.clientY);
        overed = found[0], overed.highlight();
    }, this));
}

Puzz.Utils.inherit(Puzzle, Puzz.Observer);

var Proto = Puzzle.prototype;

Proto.EVENTS = {
    leftClick: 'leftClick',
    rightClick: 'rightClick'
};

Proto.findPieces = function(clientX, clientY) {
    var offset = this.viewport.offset();
    var eventX = clientX - offset.left;
    var eventY = clientY - offset.top;
    var found = this.checkIndexByCoordinates(eventX, eventY);

    return _.select(found, function(piece) {
        return piece.hasPoint(eventX, eventY);
    });
};

Proto.checkIndexByCoordinates = function(x, y) {
    var xIndex = x - (x % this.indexCellSize);
    var yIndex = y - (y % this.indexCellSize);
    
    if (!_.isUndefined(index[xIndex]) &&
        !_.isUndefined(index[xIndex][yIndex])) {
        return index[xIndex][yIndex];
    }
    return false;
};

Proto.buildIndex = function() {
    var cellSize = this.indexCellSize;
    var pieceSize = this.model.get('pieceSize');

    _.each(this.pieces, function(row) {
        _.each(row, function(piece) {
            var cellsCount = 1;
            
            if (pieceSize > cellSize) {
                cellsCount += Math.floor(pieceSize / cellSize);
            }

            for (var h = 0; h < cellsCount; h++) {
                var xIndex = piece.xCoord - (piece.xCoord % cellSize) + (h * cellSize);
                if (this.index[xIndex] == null) {
                    this.index[xIndex] = {};
                }
            
                for (var v = 0; v < cellsCount; v++) {
                    var yIndex = piece.yCoord - (piece.yCoord % cellSize) + (v * cellSize);
                    if (this.index[xIndex][yIndex] == null) {
                        this.index[xIndex][yIndex] = [];
                    }
                
                    this.index[xIndex][yIndex].push(piece);
                }
            }
        }, this);
    }, this);
};

Proto.isSameType = function(first, second) {
    if(first.ears.left == second.ears.left &&
       first.ears.bottom == second.ears.bottom &&
       first.ears.right == second.ears.right &&
       first.ears.top == second.ears.top) {
        return true;
    }
    return false;
};

Proto.flipPieces = function(first, second) {
    var tmpX = first.realX;
    var tmpY = first.realY;
    first.realX = second.realX;
    first.realY = second.realY;
    second.realX = tmpX;
    second.realY = tmpY;
    second.render();
    first.render();
}

Proto.flipPiecesByCoords = function(coords) {
    var first = getPiece(coords[0][0], coords[0][1]);
    var second = getPiece(coords[1][0], coords[1][1]);
    flipPieces(first, second);
};

Proto.addPiece = function(data) {
    var piece = new Puzz.Views.Piece({
        size: this.model.get('pieceSize'),
        ears: {
            left: data.l, bottom: data.b,
            right: data.r, top: data.t
        },
        x: data.x,y: data.y,
        realX: data.realX,
        realY: data.realY,
        locked: data.d
    });

    this.viewport.append(piece.element);

    if(_.isUndefined(this.pieces[data.y])) {
        this.pieces[data.y] = {};
    }
    return this.pieces[data.y][data.x] = piece;
};

Proto.getPiece = function(x, y) {
    if(!_.isUndefined(this.pieces[y]) &&
       !_.isUndefined(this.pieces[y][x])) {
        return this.pieces[y][x];
    }
    return false;
};

window.Puzz.Views.Puzzle = Puzzle;

})();