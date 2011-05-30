var models = require('./models');
var Sessions = models.Sessions;

Sessions.add = function(userId, sessionId, callback) {
    var session = new Sessions();
    session.userId = userId;
    session.sessionId = sessionId;
    session.save(callback);
};

Sessions.clear = function(sessionId, callback) {
    Sessions.remove({sessionId: sessionId}, function(error) {
        callback();
    });
};

Sessions.findUserId = function(sessionId, callback) {
    Sessions.findOne({sessionId: sessionId}, function(error, session) {
        if (session) {
            callback(session.userId);
        } else {
            callback(false);
        }
    });
};

module.exports = Sessions;