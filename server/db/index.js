var mongoose = require('mongoose');
var Puzzles = require('./puzzles');
var Users = require('./users');

module.exports = {
    connect: function(callback) {
        mongoose.connect('mongodb://172.16.45.128/puzzles');
        mongoose.connection.on('open', function() {
            callback.call(null);
        });
    },

    Puzzles: Puzzles,
    Users: Users
};