window.Puzz = (function(ns) {

function Viewport() {
    this.element = $('#viewport').viewport();
    this.content = this.element.viewport('content');
    this.pieceSize = 150;
    this.tooltips = {};

    this.content.draggable({containment: 'parent'});
    this.content.scraggable({containment: 'parent', sensitivity: 10});

    $(window).resize(_.bind(function() {
         this.element.viewport('adjust');
    }, this));
}

Viewport.prototype.arrange = function(vLength, hLength) {
    var step = Math.floor(this.pieceSize / 6);
    var rectSize = step * 4 + 1;
    var height = rectSize * vLength + step * 2;
    var width = rectSize * hLength + step * 2;

    this.element.viewport('size', height, width);
    this.element.viewport('update');
};

Viewport.prototype.addTooltip = function(top, left, title) {
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

Viewport.prototype.removeTooltip = function(top, left) {
    if (!_.isUndefined(this.tooltips[left]) &&
        !_.isUndefined(this.tooltips[left][top])) {
        this.tooltips[left][top].remove();
        delete this.tooltips[left][top];
    }
};

Viewport.prototype.removeTooltips = function() {
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