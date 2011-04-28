var _ = require('../shared/underscore')._;
var util = require('util');

function Channel() {
    this.sessions = [];

	/*setInterval(_.bind(function() {
		_.each(this.sessions, function(session) {
			var length = session.client.connection._writeQueue.length;
			if (length > 0) {
				util.log('Queue length: ' + length + ' id: ' + session.userId);
			}
		});
	}, this), 10000);*/
}

Channel.prototype.add = function(session) {
    if (_.include(this.sessions, session)) {
        console.log('Trying to add already added session');
        return;
    }
    this.sessions.push(session);
};

Channel.prototype.remove = function(session) {
    if (!_.include(this.sessions, session)) {
        console.log('Trying to remove not added session');
        return;
    }
    this.sessions.splice(this.sessions.indexOf(session), 1);
};

Channel.prototype.includes = function(session) {
    if (_.include(this.sessions, session)) {
        return true;
    }
    return false;
};

Channel.prototype.broadcast = function(event, data, except) {
    except = except || [];
    _.each(this.sessions, function(session) {
        if (!_.include(except, session)) {
            session.send(event, data);
        }
    });
};

Channel.prototype.length = function() {
    return this.sessions.length;
};

module.exports = Channel;