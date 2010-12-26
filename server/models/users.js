var ObjectID = require('mongodb').ObjectID;

function loader(collection) {
    function addUser(name, callback) {
        var userData = {
            name: name,
            score: 0,
            maps: []
        };

        collection.insert(userData, function(err, data) {
            if(!err) {
                callback.call(null, user(data[0]._id));
            } else {
                throw err;
            }
        });
    }

    function getUser(userId, callback) {
        var clause = {_id: new ObjectID(userId)};
        collection.findOne(clause, function(err, userData) {
            if(!err) {
                if(userData) {
                    callback.call(null, user(userId));
                } else {
                    callback.call(null);
                }
            } else {
                throw err;
            }
        });
    }

    function user(userId) {

        function getData(callback) {
            var clause = {_id: new ObjectID(userId)};
            collection.findOne(clause, function(err, userData) {
                if(!err) {
                    callback.call(null, userData);
                } else {
                    throw err;
                }
            });
        }

        function updateData(data, callback) {
            var update = {$set: data};
            var clause = {_id: new ObjectID(userId)};
            collection.update(clause, update, function(err, userData) {
                if(!err) {
                    callback.call(null, userData);
                } else {
                    throw err;
                }
            });
        }

        function updateMapData(mapId, data, callback) {
            getData(function(userData) {
                for(var i in userData.maps) {
                    if(userData.maps[i].mapId == mapId) {
                        userData.maps[i].score = data.score;
                        collection.save(userData, function(err, userData) {
                            if(!err) {
                                callback.call(null, userData);
                            } else {
                                throw err;
                            }
                        });
                        break;
                    }
                }
            });
        }

        function link2Map(mapId, callback) {
            getData(function(userData) {
                userData.maps.push({mapId: mapId, score: 0});
                collection.save(userData, function(err, userData) {
                    if(!err) {
                        callback.call(null, userData);
                    } else {
                        throw err;
                    }
                });
            });
        }

        function linked2Map(mapId, callback) {
            getData(function(data) {
                var linked = false;
                for(var i in data.maps) {
                    if(data.maps[i].mapId == mapId) {
                        linked = true;
                        break;
                    }
                }
                callback.call(null, linked);
            });
        }

        return {
            getData: getData,
            updateData: updateData,
            updateMapData: updateMapData,
            link2Map: link2Map,
            linked2Map: linked2Map
        };
    }

    return {
        addUser: addUser,
        getUser: getUser
    };
}

exports.load = loader;