var mongoose = require('mongoose');
var config = require('../../config');
var Puzzles = require('./puzzles');
var Users = require('./users');

module.exports = {
    connect: function(callback) {
        mongoose.connect(config.MONGODB_USER + '://' +
                         config.MONGODB_HOST + '/' +
                         config.MONGODB_DATABASE,
            function(err) {
                if (err) {
                    callback(err);
                }
            });
        mongoose.connection.on('open', function() {
            callback.call(null);
        });
    },

    Puzzles: Puzzles,
    Users: Users
};