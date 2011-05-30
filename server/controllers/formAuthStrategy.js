var db = require('../db');

module.exports = function() {    
    return {
        name: 'form',
        
        authenticate: function(req, res, callback) {
            
            if(req.fields === undefined ||
               req.fields.username === undefined ||
               req.fields.password === undefined) { 
                this.fail(callback);
                return;
            }
            
            var query = {
                name: req.fields.username,
                password: req.fields.password,
                anonymous: false
            };
            
            var self = this;
            
            db.Users.findOne(query, function(error, user) {
                if (user) {
                    db.Sessions.add(user._id, req.sessionID, function() {
                        self.success({name: user.name}, callback);
                    });
                } else {
                    self.fail(callback);
                }
            });
        }
    };
};