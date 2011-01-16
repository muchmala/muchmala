var map = require('./map');

var loader = function(mapsCollection, piecesCollection) {

    return {
        addMap: function(width, height, pieceSize, imageSrc, name, callback) {
            var pieces = generatePieces(width, height, pieceSize);
            var piecesCount = pieces.length;

            var mapData = {
                name: name,
                visible: false,

                imageSrc: imageSrc,
                pieceSize: pieceSize,
                piecesCount: piecesCount,

                width: width,
                height: height,
                created: new Date(),
                connectedUsers: []
            };


            mapsCollection.insert(mapData, function(error, ids) {
                var mapId = ids[0]._id;

                for (var i = 0, j = 1; i < piecesCount; ++i) {
                    pieces[i].mapId = mapId;
                    piecesCollection.insert(pieces[i], function(error, ids) {
                        if (j == piecesCount) {
                            mapsCollection.update(
                                {_id: mapId},
                                {$set: {"visible": true}},
                                function(error, result) {
                                    if (!error) {
                                        callback.call(null, map.load(mapsCollection, piecesCollection, mapId));
                                    }
                                });
                        }

                        ++j;
                    });
                }
            });
        },

        getLastMap: function(callback) {
            mapsCollection.find({visible: true, created:{$lt:new Date()}}, {sort: [['created', -1]], limit: 1}, function(error, cursor) {
                cursor.toArray(function(error, items) {
                    callback.call(null, map.load(mapsCollection, piecesCollection, items[0]._id));
                });
            });
        },

        getMapById: function(id, callback) {
            callback.call(null, map.load(mapsCollection, piecesCollection, id));
        }
    };
};

function toInt(value) {
    return parseInt(value, 10);
}

function rand(max) {
    return Math.floor(Math.random() * (max + 1));
}

function generatePiece(x, y) {
    return {
        realX: x,
        realY: y,
        x: x,
        y: y,
        top: rand(1),
        bottom: rand(1),
        left: rand(1),
        right: rand(1),
        locked: '',
        mapId: ''
    };
}

function generatePieces(width, height, pieceSize) {
    var rectSize = toInt(pieceSize/3 * 2);
    var countH = toInt((width - rectSize/2) / rectSize);
    var countV = toInt((height - rectSize/2) / rectSize);

    var initialPositions = [];

    var typesIndex = {};
    var piecesSequence = [];

    var piece;

    for (var y = 0; y < countV; y++) {
        initialPositions[y] = [];

        for (var x = 0; x < countH; x++) {
            piece = generatePiece(x, y);

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

    return getShuffled();

    function addToIndex(piece) {
        var key = '' + piece.left + piece.bottom +
                 piece.right + piece.top;

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

exports.load = loader;
