(function() {

function Twenty(server) {
	Twenty.superproto.constructor.call(this, {'list': []});

    this.server = server;
	this.server.on(MESSAGES.topTwenty, _.bind(function(data) {
		this.set('list', data);
	}, this));
}

Puzz.Utils.inherit(Twenty, Puzz.Model);

var Proto = Twenty.prototype;

Proto.fetch = function() {
    this.server.getTopTwenty();
};

Proto.getListSortedBy = function(sortBy) {
	return _.sortBy(this.get('list'), function(row) {
    	return row[sortBy];
	});
};

Puzz.Models.Twenty = Twenty;

})();