(function() {

function User(server) {
    var storage = Puzz.Storage;
    
    User.superproto.constructor.call(this, {
       'id': storage.user.id(),
       'name': 'anonymous',
       'score': 0
    });
    	
	server.on(MESSAGES.userData, _.bind(function(data) {
		this.refresh(data);
		storage.user.id(data.id);
    }, this));

	server.on(MESSAGES.scoreAdded, _.bind(function(data) {
        this.set('score', _.reduce(data, function(memo, piece) {
			return memo + piece.pts;
		}, 0));
    }, this));

	this.on = this.observer.on;
	this.once = this.observer.once;
}

Puzz.Utils.inherit(User, Puzz.Model);

Puzz.Models.User = User;

})();