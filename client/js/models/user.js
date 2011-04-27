(function() {

function User(server) {
    User.superproto.constructor.call(this, {
       'id': Puzz.Storage.user.id(),
       'name': 'anonymous',
       'score': 0
    });
    
    this.server = server;
    	
	this.server.on(MESSAGES.userData, _.bind(function(data) {
		Puzz.Storage.user.id(data.id);
		this.refresh(data);
    }, this));

	this.server.on(MESSAGES.scoreAdded, _.bind(function(data) {
	    var added = _.reduce(data, function(memo, piece) {
			return memo + piece.pts;
		}, 0);
        this.set('score', this.get('score') + added);
    }, this));
    
    this.server.on(MESSAGES.setUserName, _.bind(function(data) {
        if (_.isUndefined(data.error)) {
            this.fire('error:saving:name', data.error);
        } else {
            this.fire('saved:name');
        }
    }, this));
}

Puzz.Utils.inherit(User, Puzz.Model);

var Proto = User.prototype;

Proto.save = function(attributeName) {
    this.server.setUserName(this.get('name'));
};

Puzz.Models.User = User;

})();