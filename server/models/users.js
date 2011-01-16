var user = require('./user');

exports.load = function(collection) {
    function addUser(name, callback) {
        var userData = {
            name: name,
            score: 0,
            maps: []
        };

        collection.insert(userData, function(err, data) {
            if(!err) {
                callback.call(null, user.load(collection, data[0]._id));
            } else {
                throw err;
            }
        });
    }

    function getUser(userId, callback) {
        collection.findOne({_id: userId}, function(err, userData) {
            if(!err) {
                if(userData) {
                    callback.call(null, user.load(collection, userId));
                } else {
                    callback.call(null);
                }
            }
        });
    }

    function getUsersLinked2Map(mapId, callback) {
        var clause = {maps: {$elemMatch: {mapId: mapId}}};

        collection.find(clause, function(error, cursor) {
            if(!error) {
                cursor.toArray(function(error, users) {
                    var result = [];

                    for(var i = 0; i < users.length; i++) {
                        var user = users[i]
                        var curMapScore = 0;

                        for(var j = 0; j < user.maps.length; j++) {
                            if(user.maps[j].mapId.id == mapId.id) {
                                curMapScore = user.maps[j].score;
                            }
                        }

                        result.push({
                            name: user.name,
                            score: user.score,
                            curMapScore: curMapScore
                        });

                        result.sort(function(a, b) {
                            return b.curMapScore - a.curMapScore;
                        });
                    }
                    
                    callback.call(null, result);
                });
            }
        });
    }

    return {
        addUser: addUser,
        getUser: getUser,
        getUsersLinked2Map: getUsersLinked2Map
    };
};