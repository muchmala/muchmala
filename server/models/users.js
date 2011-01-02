var db = require('../db');

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
        var _id = new db.ObjectId(userId);
        collection.findOne({_id: _id}, function(err, userData) {
            if(!err) {
                if(userData) {
                    callback.call(null, user(_id));
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
            collection.findOne({_id: userId}, function(err, userData) {
                if(!err) {
                    callback.call(null, userData);
                } else {
                    throw err;
                }
            });
        }

        function updateData(data, callback) {
            var update = {$set: data};
            collection.update({_id: userId}, update, function(err, userData) {
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
                collection.save(userData, function(error, userData) {
                    if(!error) {
                        if(callback) {
                            callback.call(null, userData);
                        }
                    }
                });
            });
        }

        function linked2Map(mapId, callback) {
            var clause = {
                _id: userId, maps: {
                    $elemMatch: {
                        mapId: mapId
                    }
                }
            };
            collection.findOne(clause, function(error, userData) {
                var linked = false;
                if(!error && userData) {
                    linked = true;
                }
                callback.call(null, linked);
            });
        }

        return {
            get _id() {
                return userId;
            },

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