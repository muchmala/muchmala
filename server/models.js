var db = require('./db');

var MapsLoader = function(mapsCollection) {
    var Map = function(id, callback) {

        mapsCollection.findOne({_id: new db.ObjectId(id)}, function(error, mapInfo) {
            function findElement(x, y) {
                for (var i in mapInfo.pieces) {
                    if (mapInfo.pieces[i].x == x && mapInfo.pieces[i].y == y) {
                        return i;
                    }
                }
            }

            var mapInterface = {
                lock: function(x, y, userId, callback) {
                    var i = findElement(x, y);
                    if (mapInfo.pieces[i].locked &&
                        mapInfo.pieces[i].locked != userId) {

                        callback.call(this, false);
                        return;
                    }

                    mapInfo.pieces[i].locked = userId;
                    callback.call(this, true);
                },

                unlock: function(x, y, userId, callback) {
                    var i = findElement(x, y);
                    if (mapInfo.pieces[i].locked == userId) {
                        mapInfo.pieces[i].locked = '';

                        callback.call(this, true);
                        return;
                    }

                    callback.call(this, false);
                },

                unlockAll: function(userId, callback) {
                    var lockedItems = [];

                    for (var i in mapInfo.pieces) {
                        if (mapInfo.pieces[i].locked == userId) {
                            mapInfo.pieces[i].locked = '';

                            lockedItems.push([mapInfo.pieces[i].x, mapInfo.pieces[i].y]);
                        }
                    }

                    callback.call(this, lockedItems);
                },

                flip: function(x1, y1, x2, y2, userId, callback) {
                    var i = findElement(x1, y1);
                    var j = findElement(x2, y2);

                    if (mapInfo.pieces[i].locked == userId &&
                        mapInfo.pieces[j].locked == '') {

                        mapInfo.pieces[i].locked = '';

                        var c = mapInfo.pieces[j].x;
                        mapInfo.pieces[j].x = mapInfo.pieces[i].x;
                        mapInfo.pieces[i].x = c;

                        c = mapInfo.pieces[j].y;
                        mapInfo.pieces[j].y = mapInfo.pieces[i].y;
                        mapInfo.pieces[i].y = c;

                        callback.call(this, true);
                        return;
                    }

                    callback.call(this, false);
                },

                getCompactInfo: function(callback) {
                    var compactData = {
                        imageSrc: mapInfo.imageSrc,
                        piceSize: mapInfo.pieceSize,
                        map: []
                    };

                    var pieces = mapInfo.pieces.concat();

                    for (var i in pieces) {
                        if (compactData.map[pieces[i].y] === undefined) {
                            compactData.map[pieces[i].y] = [];
                        }

                        compactData.map[pieces[i].y][pieces[i].x] = {
                            t: pieces[i].top,
                            l: pieces[i].left,
                            b: pieces[i].bottom,
                            r: pieces[i].right,
                            x: pieces[i].realX,
                            y: pieces[i].realY,
                            d: !!pieces[i].locked
                        };
                    }

                    callback.call(this, compactData);
                }
            };

            for (var i in mapInfo) {
                mapInterface.__defineGetter__(i, (function(value){
                    return function() {
                        return value;
                    };
                })(mapInfo[i]));
            }

            callback.call(this, mapInterface);
        });
    };

    return {
        generateMap: function(width, height, pieceSize, imageSrc, name, callback) {
            var mapData = {
                name: name,
                imageSrc: imageSrc,
                pieceSize: pieceSize,
                width: width,
                height: height,
                created: new Date(),
                pieces: generatePieces(width, height, pieceSize)
            };

            mapsCollection.insert(mapData, function(error, ids) {
                Map(ids[0]._id.toHexString(), callback);
            });
        },

        getLastMap: function(callback) {
            mapsCollection.find({created:{$lt:new Date()}}, {sort: [['created', -1]], limit: 1}, function(error, cursor) {
                cursor.toArray(function(error, items) {
                    Map(items[0]._id.toHexString(), callback);
                });
            });
        },

        getMapById: function(id, callback) {
            Map(id, callback);
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
        locked: ''
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

exports.MapsLoader = MapsLoader;
