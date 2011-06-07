var db = require('muchmala-common').db;
var _ = require('underscore');

module.exports = function(server) {
    server.get('/users/toptwenty', function(req, res) {
        db.Users.all(20, function(users) {
            var result = _.map(users, function(user) {
                return {
                    name: user.name,
                    score: user.score,
                    created: user.created.getTime()
                };
            });
            res.end(JSON.stringify(result));
        });
    });
};