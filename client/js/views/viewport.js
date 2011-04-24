window.Puzz = (function(ns) {

function Viewport(server) {
    this.element = $('#viewport').viewport();
    this.content = this.element.viewport('content');
	
	this.menu = new Puzz.MenuDialog(server);
    this.panel = new Puzz.Panel(server, this.menu);
    this.complete = new Puzz.CompleteDialog(server);

	this.selectedIndicator = $('#selected');

    this.pieceSize = 150;
    this.tooltips = {};

    this.content.draggable({containment: 'parent'});
    this.content.scraggable({containment: 'parent', sensitivity: 10});

    $(window).resize(_.bind(function() {
         this.element.viewport('adjust');
    }, this));

	server.on(MESSAGES.puzzleData, _.bind(function(data) {
        if (data.completion != 100 || complete.shown || complete.closed) { return; }
		this.menu.on('hidden', function() { complete.show(data); });
		this.menu.hide();
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
	this.panel.loading();
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
    var step = Math.floor(this.pieceSize / 6);
    var rectSize = step * 4 + 1;
    var height = rectSize * vLength + step * 2;
    var width = rectSize * hLength + step * 2;

    this.element.viewport('size', height, width);
    this.element.viewport('update');
};

Proto.addTooltip = function(top, left, title) {
     var tooltip = $('<div class="tooltip"><span>' + title + '</span></div>')
        .appendTo(this.content)
        .css('left', left + Math.floor(this.pieceSize / 2))
        .css('top', top + Math.floor(this.pieceSize / 2));

    tooltip.css('margin-left', -Math.floor(tooltip.outerWidth() / 2));

    if (_.isUndefined(this.tooltips[left])) {
        this.tooltips[left] = {};
    }
    
    this.tooltips[left][top] = tooltip;
};

Proto.removeTooltip = function(top, left) {
    if (!_.isUndefined(this.tooltips[left]) &&
        !_.isUndefined(this.tooltips[left][top])) {
        this.tooltips[left][top].remove();
        delete this.tooltips[left][top];
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

ns.Viewport = Viewport;

return ns;

})(window.Puzz || {});