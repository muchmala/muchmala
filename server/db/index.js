var mongoose = require('mongoose');
var Puzzles = require('./puzzles');
var Users = require('./users');

module.exports = {
    connect: function(callback) {
        mongoose.connect('mongodb://172.16.45.128/puzzles');
        mongoose.connection.on('open', function() {
            callback.call(null);
        });
    }
};

module.exports.connect(function() {
    var dummyPieces = [
        {x: 1, y: 1, realX: 2, realY: 2, top: true, bottom: true, left: true, right: true},
        {x: 2, y: 2, realX: 1, realY: 1, top: true, bottom: true, left: true, right: true}/*,
        {x: 1, y: 0, realX: 2, realY: 0, top: true, bottom: true, left: true, right: true},
        {x: 2, y: 0, realX: 1, realY: 0, top: true, bottom: true, left: true, right: true},
        {x: 0, y: 0, realX: 0, realY: 0, top: true, bottom: true, left: true, right: true},
        {x: 0, y: 0, realX: 0, realY: 0, top: true, bottom: true, left: true, right: true},
        {x: 0, y: 0, realX: 0, realY: 0, top: true, bottom: true, left: true, right: true}*/
    ];

    Users.add('username', function(user) {
        Puzzles.add(dummyPieces, 150, 100, 100, 'puzzleName', function(newPuzzle) {
            newPuzzle.swap(1, 1, 2, 2, user._id, function(swaped) {
                console.log(swaped);
                console.log('Done');
                process.exit();
            });
        });
    });
});