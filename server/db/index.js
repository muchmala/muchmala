var mongoose = require('mongoose');
var config = require('../config');
var Puzzles = require('./puzzles');
var Users = require('./users');

module.exports = {
    connect: function(callback) {
        mongoose.connect(config.db.user + '://' + 
                         config.db.host + '/' +
                         config.db.name);
                     
        mongoose.connection.on('open', function() {
            callback.call(null);
        });
    },

    Puzzles: Puzzles,
    Users: Users
};