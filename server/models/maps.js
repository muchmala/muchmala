var db = require('../db');

function loader(collection) {
    function Map(id, callback) {
        var _id = new db.ObjectId(id);

        function lock(x, y, userId, callback) {
            collection.update(
                {_id: _id, pieces: {$elemMatch: {x: +x, y: +y, locked: ''}}},
                {$set: {"pieces.$.locked": userId}},
                function(error, result) {
                    callback.call(null);
                });
        }

        function unlock(x, y, userId, callback) {
            collection.update(
                {_id: _id, pieces: {$elemMatch: {x: +x, y: +y, locked: userId}}},
                {$set: {"pieces.$.locked": ''}},
                function(error, result) {
                    callback.call(null);
                });
        }

        function unlockAll(userId, callback) {
            collection.findOne({_id: _id}, function(error, mapInfo) {
                var lockedItems = [];

                for (var i in mapInfo.pieces) {
                    if (mapInfo.pieces[i].locked.id == userId.id) {
                    collection.update(
                        {_id: _id, pieces: {$elemMatch: {x: mapInfo.pieces[i].x, y: mapInfo.pieces[i].y, locked: userId}}},
                        {$set: {"pieces.$.locked": ''}});

                        lockedItems.push([mapInfo.pieces[i].x, mapInfo.pieces[i].y]);
                    }
                }

                callback.call(this, lockedItems);
            });
        }

        function flip(x1, y1, x2, y2, userId, callback) {

            function updateFirstPiece() {
                var clause = {_id: _id, pieces: {$elemMatch: {x: +x2, y: +y2, locked: ''}}, $atomic : 1};
                var update = {$set: {"pieces.$.x": +x1, "pieces.$.y": +y1}};

                collection.update(clause, update, function(error, result) {
                    if(!error) {
                        updateSecondPiece();
                    }
                });
            }

            function updateSecondPiece() {
                var clause = {_id: _id, pieces: {$elemMatch: {x: +x1, y: +y1, locked: userId}}, $atomic : 1};
                var update = {$set: {"pieces.$.locked": '', "pieces.$.x": +x2, "pieces.$.y": +y2}};

                collection.update(clause, update, function(error) {
                    if(!error) {
                        callback.call(null);
                    }
                });
            }

            var clause = {_id: _id, pieces: {$elemMatch: {x: +x1, y: +y1, locked: userId}}};

            collection.findOne(clause, function(error, mapData) {
                if (!error && mapData != null) {
                    updateFirstPiece();
                }
            });
        }

        function getCompactInfo(callback) {
            collection.findOne({_id: _id}, function(error, mapInfo) {
                console.log(mapInfo.created);
                var compactData = {
                    id: id,
                    imageSrc: mapInfo.imageSrc,
                    piceSize: mapInfo.pieceSize,
                    created: mapInfo.created,
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
            });
        }

        function addConnectedUser(userId, callback) {
            userId = new db.ObjectId(userId);

            collection.findOne({_id: _id}, function(error, mapData) {
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
                        collection.save(mapData, function(error) {
                            if(!error) {
                                callback.call(null, true)
                            }
                        });
                    } else {
                        callback.call(null, false)
                    }
                }
            });
        }

        function removeConnectedUser(userId, callback) {
            userId = new db.ObjectId(userId);

            collection.findOne({_id: _id}, function(error, mapData) {
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
                        collection.save(mapData, function(error) {
                            if(!error) {
                                callback.call(null, true)
                            }
                        });
                    } else {
                        callback.call(null, false)
                    }
                }
            });
        }

        function removeConnectedUsers(callback) {
            collection.findOne({_id: _id}, function(error, mapData) {
                if(!error) {
                    if(mapData.connectedUsers.length) {
                        mapData.connectedUsers = [];
                        collection.save(mapData, function(error) {
                            if(!error) {
                                callback.call(null, true)
                            }
                        });
                    } else {
                        callback.call(null, false)
                    }
                }
            });
        }

        function getConnectedUsers(callback) {
            collection.findOne({_id: _id}, function(error, mapData) {
                if(!error) {
                    callback.call(null, mapData.connectedUsers)
                }
            });
        }

        function getCompleteLevel(callback) {
            collection.findOne({_id: _id}, function(error, mapData) {
                var pieces = mapData.pieces.concat();
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
        }

        function getPiece(x, y, callback) {
            var clause = {_id: _id, pieces: {$elemMatch: {x: +x, y: +y}}};
            collection.findOne(clause, function(error, mapData) {
                
                if (!error && mapData != null) {
                    var result = null;
                
                    for(var i = 0; i < mapData.pieces.length; i++) {
                        var piece = mapData.pieces[i];
                        if(piece.x == x && piece.y == y) {
                            result = piece;
                            break;
                        }
                    }
                    callback.call(null, result);
                }
            });
        }

        callback.call(this, {
            lock: lock,
            unlock: unlock,
            flip: flip,
            unlockAll: unlockAll,
            getCompactInfo: getCompactInfo,
            addConnectedUser: addConnectedUser,
            removeConnectedUser: removeConnectedUser,
            getConnectedUsers: getConnectedUsers,
            getCompleteLevel: getCompleteLevel,
            getPiece: getPiece,
            get _id () {
                return _id;
            }
        });
    }

    return {
        addMap: function(width, height, pieceSize, imageSrc, name, callback) {
            var mapData = {
                name: name,
                imageSrc: imageSrc,
                pieceSize: pieceSize,
                width: width,
                height: height,
                connectedUsers: [],
                created: +(new Date())+'',
                pieces: generatePieces(width, height, pieceSize)
            };

            collection.insert(mapData, function(error, ids) {
                Map(ids[0]._id.toHexString(), callback);
            });
        },

        getLastMap: function(callback) {

            var clause = {created:{$lt:+(new Date())+''}};
            var options = {sort: [['created', -1]], limit: 1};

            collection.find(clause, options, function(error, cursor) {
                cursor.toArray(function(error, items) {
                    Map(items[0]._id.toHexString(), callback);
                });
            });
        },

        getMapById: function(id, callback) {
            Map(id, callback);
        }
    };
}

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

exports.load = loader;
