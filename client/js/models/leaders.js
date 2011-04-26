window.Puzz = (function(ns) {

function Leaders(server) {
	this.observer = ns.Utils.Observer();
	this.list = [];
	
	server.on(MESSAGES.leadersBoard, _.bind(function(data) {
		this.list = data;
		this.observer.fire('change');
	}, this));
	
	this.on = this.observer.on;
	this.once = this.observer.once;
}

var Proto = Leaders.prototype;

Proto.getSortedBy = function(sortBy) {
	return _.sortBy(this.list, function(row) {
    	return row[sortBy];
	});
};

return ns.Models.Leaders = Leaders, ns;

})(window.Puzz);