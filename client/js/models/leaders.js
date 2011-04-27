(function() {

function Leaders(server) {
	Leaders.superproto.constructor.call(this, {'list': []});
    
	server.on(MESSAGES.leadersBoard, _.bind(function(data) {
		this.set('list', data);
	}, this));
}

Puzz.Utils.inherit(Leaders, Puzz.Model);

var Proto = Leaders.prototype;

Proto.getListSortedBy = function(sortBy) {
	return _.sortBy(this.get('list'), function(row) {
    	return row[sortBy];
	});
};

Puzz.Models.Leaders = Leaders;

})();