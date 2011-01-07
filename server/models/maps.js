var db = require('../db');

var loader = function(mapsCollection, piecesCollection) {

    var Map = function(id, callback) {
        var _id = new db.ObjectId(id);

        callback.call(this, {
            lock: function(x, y, userId, callback) {
                piecesCollection.update(
                    {mapId: _id, x: +x, y: +y, locked: ''},
                    {$set: {locked: userId}},
                    function(error, result) {
                        callback.call(this, true);
                    });
            },

            unlock: function(x, y, userId, callback) {
                piecesCollection.update(
                    {mapId: _id, x: +x, y: +y, locked: userId},
                    {$set: {locked: ''}},
                    function(error, result) {
                        callback.call(this, true);
                    });
            },

            unlockAll: function(userId, callback) {
                piecesCollection.find(
                    {mapId: _id, locked: userId},
                    function(error, cursor) {
                        cursor.toArray(function(error, pieces) {
                            var lockedItems = [];

                            for (var i in pieces) {
                                lockedItems.push([pieces[i].x, pieces[i].y]);
                            }

                            piecesCollection.update(
                                {mapId: _id, locked: userId},
                                {$set: {"locked": ''}},
                                {multi: true},
                                function(error, mapInfo) {
                                    callback.call(this, lockedItems);
                                });
                        });
                    });
            },

            flip: function(x1, y1, x2, y2, userId, callback) {
                piecesCollection.findOne({mapId: _id, x: +x1, y: +y1, locked: userId},
                function(error, piece) {
                    if (piece === undefined) {
                        callback.call(this, false);
                    } else {
                        piecesCollection.update({mapId: _id, x: +x2, y: +y2, locked: ''},
                            {$set: {x: +x1, y: +y1}},
                            function(error, result) {

                                piecesCollection.update({mapId: _id, x: +x1, y: +y1, locked: userId},
                                    {$set: {x: +x2, y: +y2, locked: ''}},
                                    function(error, result) {
                                        callback.call(this, true);
                                    });
                            });
                    }
                });
            },

            getCompactInfo: function(callback) {
                mapsCollection.findOne({_id: _id}, function(error, mapInfo) {
                    var compactData = {
                        id: id,
                        imageSrc: mapInfo.imageSrc,
                        piceSize: mapInfo.pieceSize,
                        created: mapInfo.created,
                        map: []
                    };

                    piecesCollection.find({mapId: _id}, function(error, cursor) {
                        cursor.toArray(function(error, pieces) {
                            var piece;
                            for (var i in pieces) {
                                piece = pieces[i];

                                if (compactData.map[piece.y] === undefined) {
                                    compactData.map[piece.y] = [];
                                }

                                compactData.map[piece.y][piece.x] = {
                                    t: piece.top,
                                    l: piece.left,
                                    b: piece.bottom,
                                    r: piece.right,
                                    x: piece.realX,
                                    y: piece.realY,
                                    d: !!piece.locked
                                };
                            }

                            callback.call(this, compactData);
                        });
                    });

                });
            },

            addConnectedUser: function(userId, callback) {
                userId = new db.ObjectId(userId);

                mapsCollection.findOne({_id: _id}, function(error, mapData) {
                    if(!error) {
                        var inArray = false;
                        for(var i = 0, len = mapData.connectedUsers.length; i < len; i++) {
                            if(mapData.connectedUsers[i].id == userId.id) {
                                inArray = true;
                                break;
                            }
                        }

                        if(!inArray) {
                            mapData.connectedUsers.push(userId);
                            mapsCollection.save(mapData, function(error) {
                                if(!error) {
                                    callback.call(null, true)
                                }
                            });
                        } else {
                            callback.call(null, false)
                        }
                    }
                });
            },

            removeConnectedUser: function(userId, callback) {
                userId = new db.ObjectId(userId);

                mapsCollection.findOne({_id: _id}, function(error, mapData) {
                    if(!error) {
                        var index = -1;
                        for(var i = 0, len = mapData.connectedUsers.length; i < len; i++) {
                            if(mapData.connectedUsers[i].id == userId.id) {
                                index = i;
                                break;
                            }
                        }

                        if(index >= 0) {
                            mapData.connectedUsers.splice(index, 1);
                            mapsCollection.save(mapData, function(error) {
                                if(!error) {
                                    callback.call(null, true)
                                }
                            });
                        } else {
                            callback.call(null, false)
                        }
                    }
                });
            },

            removeConnectedUsers: function(callback) {
                mapsCollection.findOne({_id: _id}, function(error, mapData) {
                    if(!error) {
                        if(mapData.connectedUsers.length) {
                            mapData.connectedUsers = [];
                            mapsCollection.save(mapData, function(error) {
                                if(!error) {
                                    callback.call(null, true)
                                }
                            });
                        } else {
                            callback.call(null, false)
                        }
                    }
                });
            },

            getConnectedUsers: function(callback) {
                mapsCollection.findOne({_id: _id}, function(error, mapData) {
                    if(!error) {
                        callback.call(null, mapData.connectedUsers)
                    }
                });
            },

            getCompleteLevel: function(callback) {
                piecesCollection.find({mapId: _id}, function(error, cursor) {
                    cursor.toArray(function(error, pieces) {
                        var totalCount = pieces.length;
                        var completedCount = 0;

                        for (var i = 0; i < totalCount; i++) {
                            if(pieces[i].x == pieces[i].realX &&
                               pieces[i].y == pieces[i].realY) {
                                completedCount++;
                            }
                        }
                        callback.call(null, parseInt(100 / totalCount * completedCount));
                    });
                });
            },

            getPiece: function(x, y, callback) {
                var clause = {mapId: _id, x: +x, y: +y};
                piecesCollection.findOne(clause, function(error, pieceData) {
                    var result = null;
                    if (!error && pieceData != null) {
                        result = pieceData;
                    }
                    callback.call(null, result);
                });
            },

            get _id () {
                return _id;
            }
        });
    };

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
                created: +(new Date())+'',
                connectedUsers: []
            };


            mapsCollection.insert(mapData, function(error, ids) {
                var mapId = ids[0]._id;

                for (var i = 0, j = 1; i < piecesCount; ++i) {
                    pieces[i].mapId = mapId;
                    piecesCollection.insert(pieces[i], function(error, ids) {
                        ++j;

                        if (j == piecesCount) {
                            mapsCollection.update(
                                {_id: mapId},
                                {$set: {"visible": true}},
                                function(error, result) {
                                    if (!error) {
                                        Map(mapId.toHexString(), callback);
                                    }
                                });
                        }
                    });
                }
            });
        },

        getLastMap: function(callback) {
            mapsCollection.find({visible: true, created:{$lt:+(new Date())+''}}, {sort: [['created', -1]], limit: 1}, function(error, cursor) {
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