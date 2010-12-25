function loader(collection) {
    function addUser(userName, callback) {
        collection.insert({name: userName}, callback);
    }

    function getUser(userId, callback) {
        callback.call(null, user(userId));
    }

    function user(userId) {

        function getData(callback) {
            collection.findOne({id: userId}, callback);
        }

        function getMapsData(data, callback) {

        }

        function updateData(data, callback) {
            
        }

        function updateMapData(mapId, data, callback) {

        }

        function linkMap(mapId, callback) {

        }

        return {
            getData: getData
        };
    }

    return {
        addUser: addUser,
        getUser: getUser
    };
}

exports.load = loader;