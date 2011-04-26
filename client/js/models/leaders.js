(function() {

function Leaders(server) {
	Leaders.superproto.constructor.call(this, {'list': []});
    
	server.on(MESSAGES.leadersBoard, _.bind(function(data) {
		this.set('list', data);
	}, this));
}

var Proto = Leaders.prototype;

Proto.getSortedBy = function(sortBy) {
	return _.sortBy(this.get('list'), function(row) {
    	return row[sortBy];
	});
};

Puzz.Utils.inherit(Leaders, Puzz.Model);

Puzz.Models.Leaders = Leaders;

})();