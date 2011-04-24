window.Puzz = (function(ns) {

function User(server) {
	this.observer = ns.Observer();
	this.id = ns.Storage.user.id();
	this.name = 'anonymous';
	this.score = 0;
	
	server.on(MESSAGES.userData, _.bind(function(data) {
		this.id = data.id;
        this.name = data.name;
		this.score = data.score;
		ns.Storage.user.id(data.id);
		this.observer.fire('change');
    }, this));

	server.on(MESSAGES.scoreAdded, _.bind(function(data) {
        this.score = _.reduce(data, function(memo, piece) {
			return memo + piece.pts;
		}, 0);
		this.observer.fire('change');
    }, this));
}

	
ns.User = User;

return ns;

})(window.Puzz || {});