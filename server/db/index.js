var mongoose = require('mongoose');
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
    Users.add('user', function(user) {
        
        user.linkWith('123123123123123123123123', function() {
            Users.get(user._id, function(user) {
                //Users.test(user._id, function(users) {
                    //console.log(users);
                //user.score = 100;
                //user.save(function() {
                    console.log(user.toObject());
                    console.log('Done');
                    process.exit();
                //});
                //});
            });
        });

        /*user.linkPuzzle('123123123123123', function() {
            user.setPuzzleScore(user.puzzles[0]._id, 100, function() {
                console.log('Done');
                process.exit();
            });
        });*/
    });
});