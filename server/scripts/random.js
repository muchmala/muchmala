function createPiece(x, y) {
    return {
        x: x, y: y, realX: x, realY: y,
        top: Math.floor(Math.random() * 2),
        bottom: Math.floor(Math.random() * 2),
        left: Math.floor(Math.random() * 2),
        right: Math.floor(Math.random() * 2)
    };
}

function createPuzzle(width, height, pieceSize) {
    var rectSize = Math.floor(pieceSize / 3 * 2);
    var countH = Math.floor((width - rectSize / 2) / rectSize);
    var countV = Math.floor((height - rectSize / 2) / rectSize);

    var initialPositions = [];

    var typesIndex = {};
    var piecesSequence = [];

    for (var y = 0; y < countV; y++) {
        initialPositions[y] = [];

        for (var x = 0; x < countH; x++) {
            var piece = createPiece(x, y);

            if (initialPositions[y-1] != null && initialPositions[y-1][x] != null) {
                piece.top = (initialPositions[y-1][x].bottom == 1) ? 0 : 1;
            }

            if (initialPositions[y] != null && initialPositions[y][x-1] != null) {
                piece.left = (initialPositions[y][x-1].right == 1) ? 0 : 1;
            }

            initialPositions[y][x] = piece;

            addToIndex(piece);
        }
    }

    return {
        hLength: countH,
        vLength: countV,
        pieces: getShuffled()
    };

    function addToIndex(piece) {
        var key = '' + piece.left + piece.bottom + piece.right + piece.top;

        if (typesIndex[key] == null) {
            typesIndex[key] = [];
        }

        typesIndex[key].push(initialPositions[y][x]);
        piecesSequence.push(key);
    }

    function getShuffled() {
        var resultSet = [];

        for (var i in typesIndex) {
            typesIndex[i].sort(function() {
                return 0.5 - Math.random();
            });
        }

        for(var y = 0, k = 0; y < countV; y++) {
            for(var x = 0, piece; x < countH; x++, k++) {
                piece = typesIndex[piecesSequence[k]].pop();
                piece.x = x;
                piece.y = y;

                resultSet.push(piece);
            }
        }

        return resultSet;
    }
}

exports.puzzle = createPuzzle;
exports.piece = createPiece;
