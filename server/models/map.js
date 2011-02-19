exports.load = function(mapsCollection, piecesCollection, _id) {
    
    function lock(x, y, userId, callback) {
        piecesCollection.update(
            {mapId: _id, x: +x, y: +y, locked: ''},
            {$set: {locked: userId}},
            function(error, result) {
                callback.call(this, true);
            });
    }

    function unlock(x, y, userId, callback) {
        piecesCollection.update(
            {mapId: _id, x: +x, y: +y, locked: userId},
            {$set: {locked: ''}},
            function(error, result) {
                callback.call(this, true);
            });
    }

    function unlockAll(userId, callback) {
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
    }

    function flip(x1, y1, x2, y2, userId, callback) {
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
    }

    function getCompactInfo(callback) {
        mapsCollection.findOne({_id: _id}, function(error, mapInfo) {
            var compactData = {
                id: _id,
                name: mapInfo.name,
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
    }

    function addConnectedUser(userId, callback) {
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
                        if(!error && callback) {
                            callback.call(null, true)
                        }
                    });
                } else if(callback) {
                    callback.call(null, false)
                }
            }
        });
    }

    function removeConnectedUser(userId, callback) {
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
    }

    function removeConnectedUsers(callback) {
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
    }

    function getConnectedUsers(callback) {
        mapsCollection.findOne({_id: _id}, function(error, mapData) {
            if(!error) {
                callback.call(null, mapData.connectedUsers)
            }
        });
    }

    function getCompleteLevel(callback) {
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
    }

    function getPiece(x, y, callback) {
        var clause = {mapId: _id, x: +x, y: +y};
        piecesCollection.findOne(clause, function(error, pieceData) {
            var result = null;
            if (!error && pieceData != null) {
                result = pieceData;
            }
            callback.call(null, result);
        });
    }

    return {
        flip: flip,
        lock: lock,
        unlock: unlock,
        unlockAll: unlockAll,
        getPiece: getPiece,
        getCompactInfo: getCompactInfo,
        addConnectedUser: addConnectedUser,
        removeConnectedUser: removeConnectedUser,
        removeConnectedUsers: removeConnectedUsers,
        getConnectedUsers: getConnectedUsers,
        getCompleteLevel: getCompleteLevel,
        get _id () {return _id;}
    };
};