(function() {

function Viewport(puzzle, user, leaders, twenty) {
    this.element = $('#viewport').viewport();
    this.content = this.element.viewport('content');
    
    this.selectedIndicator = $('<div></div>')
    this.selectedIndicator.appendTo(this.element);
    this.selectedIndicator.attr('id', 'selected');
    
    this.menu = new Puzz.Views.MenuDialog(twenty);
    this.complete = new Puzz.Views.CompleteDialog(puzzle, leaders);
    this.panel = new Puzz.Views.Panel({
        leaders: leaders, user: user,
        menu: this.menu, puzzle: puzzle
    });

    this.pieceSize = 150;
    this.tooltips = {};

    this.content.draggable({containment: 'parent'});
    this.content.scraggable({containment: 'parent', sensitivity: 10});
    
    var self = this;

    puzzle.bind('change', _.bind(function() {
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
        var data = puzzle.toJSON();
        var step = Math.floor(data.pieceSize / 6);
        
        this.pieceSize = data.pieceSize;
        this.rectSize = step * 4 + 1;
        
        this.element.viewport('size', 
                this.rectSize * data.vLength + step * 2,
                this.rectSize * data.hLength + step * 2);

        this.updateViewportSize();
    }, this));
    
    user.bind('score', function(pieces) {
        _.each(pieces, function(piece) {
            self.blowScore(piece.x, piece.y, piece.pts);
        });
    });
    
    _.bindAll(this, 'updateViewportSize');
    this.panel.bind('move', this.updateViewportSize);
    this.panel.bind('show', this.updateViewportSize);
    this.panel.bind('hide', this.updateViewportSize);
    $(window).resize(this.updateViewportSize);
    
    if (!Puzz.Storage.menu.isHowToPlayShown()) {
        Puzz.Storage.menu.setHowToPlayShown();
        this.menu.show('howtoplay');
    }
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
};

Proto.loadingComplete = function() {
    this.panel.loadingComplete();
};

Proto.showSelectedIndicator = function(type) {
    this.selectedIndicator.attr('class', '_' + type).show();
};

Proto.hideSelectedIndicator = function() {
    this.selectedIndicator.hide();
};

Proto.updateViewportSize = function() {
    var windowWidth = $(window).width();
    var panelWidth = windowWidth - this.panel.el.position().left;
    
    this.element.width(windowWidth - panelWidth);
    this.element.viewport('adjust');
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

Proto.blowScore = function(x, y, score) {
    var score = $('<div class="score">' + score + '</div>')
        .css('left', x * this.rectSize + Math.floor(this.pieceSize / 2))
        .css('top', y * this.rectSize + Math.floor(this.pieceSize / 2))
        .appendTo(this.content);
    
    score.animate({
        'margin-top': -120, 
        'font-size': 80, 
        'opacity': 0
    }, 700, function() {
        score.remove();
    });
};

window.Puzz.Views.Viewport = Viewport;

})();