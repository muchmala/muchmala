var config = require('./config');
var mongodb = require('mongodb');
var collections = {};
var client;

function createConnection(callback) {
    if (client === undefined) {
        client = new mongodb.Db(
            config.db.name,
            new mongodb.Server(config.db.host, config.db.port, config.db.options)
        );
        client.open(function(err, client) {
            client.authenticate(config.db.username, config.db.password, function(err, replies) {
                callback.call(this, client);
            });
        });
    } else {
        callback.call(this, client);
    }
}

function useCollection(collectionName, callback) {
    if (collections[collectionName] === undefined) {
        client.collection(collectionName, function(err, collection) {
            if(!err) {
                collections[collectionName] = collection;
                callback.call(this, collections[collectionName]);
            } else {
                throw err;
            }
        });
    } else {
        callback.call(this, collections[collectionName]);
    }
}

exports.createConnection = createConnection;
exports.useCollection = useCollection;
