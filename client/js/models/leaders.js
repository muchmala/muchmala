window.Puzz = (function(ns) {

function Leaders(server) {
	this.observer = ns.Observer();
	this.list = [];
	
	server.on(MESSAGES.leadersBoard, _.bind(function(data) {
		this.list = data;
		this.observer.fire('change');
	}, this)
}

var Proto = Leaders.prototype;

Proto.getSortedBy = function(sortBy) {
	return _.sortBy(this.list, function(row) {
    	return row[sortBy];
	});
};

	
ns.Leaders = Leaders;

return ns;

})(window.Puzz || {});