(function() {

function Viewport(puzzle, user, leaders, twenty) {
    this.element = $('#viewport').viewport();
    this.content = this.element.viewport('content');
	this.selectedIndicator = $('#selected');
	
	this.menu     = new Puzz.Views.MenuDialog(twenty);
    this.panel    = new Puzz.Views.Panel(puzzle, user, leaders, this.menu);
    this.complete = new Puzz.Views.CompleteDialog(puzzle, leaders);

    this.pieceSize = 150;
    this.tooltips = {};

    this.content.draggable({containment: 'parent'});
    this.content.scraggable({containment: 'parent', sensitivity: 10});

	puzzle.on('change', _.bind(function() {
        if (puzzle.get('completion') != 100 || 
            this.complete.shown || this.complete.closed) {
            return;
        }
        this.menu.hide();
		this.menu.on('hidden', _.bind(function() {
		    this.complete.show();
		}, this));
    }, this));

	puzzle.once('change', _.bind(function() {
	    var data = puzzle.all();
        this.pieceSize = data.pieceSize;
        this.step = Math.floor(data.pieceSize / 6);
        this.rectSize = this.step * 4 + 1;
        this.arrange(data.vLength, data.hLength);
	}, this));
	
	$(window).resize(_.bind(function() {
         this.element.viewport('adjust');
    }, this));
}

var Proto = Viewport.prototype;

Proto.showMenu = function() {
	this.menu.show();
};

Proto.showPanel = function() {
	this.panel.show();
};

Proto.loading = function(percent) {
	this.panel.loading(percent);
	this.menu.loading(percent);
};

Proto.loadingComplete = function() {
	this.menu.loadingComplete();
	this.panel.loadingComplete();
};

Proto.showSelectedIndicator = function(type) {
    this.selectedIndicator.attr('class', '_' + type).show();
};

Proto.hideSelectedIndicator = function() {
    this.selectedIndicator.hide();
};

Proto.arrange = function(vLength, hLength) {
    this.element.viewport('size', 
            this.rectSize * vLength + this.step * 2,
            this.rectSize * hLength + this.step * 2);
    this.element.viewport('update');
};

Proto.addTooltip = function(x, y, title) {
    var tooltip = $('<div class="tooltip"><span>' + title + '</span></div>')
        .css('left', x * this.rectSize + Math.floor(this.pieceSize / 2))
        .css('top', y * this.rectSize + Math.floor(this.pieceSize / 2))
        .appendTo(this.content);

    tooltip.css('margin-left', -Math.floor(tooltip.outerWidth() / 2));

    if (_.isUndefined(this.tooltips[y])) {
        this.tooltips[y] = {};
    }
    
    this.tooltips[y][x] = tooltip;
};

Proto.removeTooltip = function(x, y) {
    if (!_.isUndefined(this.tooltips[y]) &&
        !_.isUndefined(this.tooltips[y][x])) {
        this.tooltips[y][x].remove();
        delete this.tooltips[y][x];
    }
};

Proto.removeTooltips = function() {
    _.each(this.tooltips, function(row) {
        _.each(row, function(tooltip) {
            tooltip.remove();
        });
    });
    this.tooltips = {};
};

window.Puzz.Views.Viewport = Viewport;

})();