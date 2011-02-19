var map = require('./map');

var loader = function(mapsCollection, piecesCollection) {

    return {
        addMap: function(piecesMap, pieceSize, name, callback) {
            var piecesCount = piecesMap.length;

            var mapData = {
                name: name,
                visible: false,
                pieceSize: pieceSize,
                piecesCount: piecesCount,
                created: new Date(),
                connectedUsers: []
            };

            mapsCollection.insert(mapData, function(error, ids) {
                var mapId = ids[0]._id;

                for (var i = 0, j = 1; i < piecesCount; ++i) {
                    piecesMap[i].mapId = mapId;
                    piecesCollection.insert(piecesMap[i], function(error, ids) {
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

exports.load = loader;
