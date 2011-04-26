window.Puzz = (function(ns) {

function Puzzle(server) {
	this.observer = ns.Utils.Observer();
	
	this.id = null;
	this.created = null;
	this.completed = null;
	this.swapsCount = 0;
	this.pieceSize = 0;
	this.connectedCount = 0;
	this.completion = 0;
	this.vLength = 0;
	this.hLength = 0;
	
	server.on(MESSAGES.puzzleData, function(data) {
		this.id = data.id;
		this.swapsCount = data.swaps;
		this.connectedCount = data.connected;
	    this.completion = data.completion;
		this.created = new Date(data.created);
	    this.vLength = data.vLength;
		this.hLength = data.hLength;
		
		if (!_.isUndefined(data.completed)) {
            this.completed = new Date(data.completed);
        }
		
		this.observer.fire('change');
	});
	
	this.on = this.observer.on;
	this.once = this.observer.once;
}

return ns.Models.Puzzle = Puzzle, ns;

})(window.Puzz);