(function() {

function Loader() {
    this.cache = {};
}

Loader.prototype.images = function(sources, callback) {
    var self = this;
    
    flow.serialForEach(_.toArray(sources), function(src) {
        this.src = src;
        this.image = new Image();
        this.image.src = STATIC_URL + this.src;
        this.image.onload = this;
    }, function() {
        self.cache[this.src] = this.image;
    }, function() {
        callback.call(null);
    });
};

Loader.prototype.covers = function(puzzleId, callback) {
    var sources = {
        defaultCoverSrc: '/img/puzzles/' + puzzleId + '/default_covers.png',
        selectCoverSrc: '/img/puzzles/' + puzzleId + '/select_covers.png',
        lockCoverSrc: '/img/puzzles/' + puzzleId + '/lock_covers.png'
    };

    this.images(sources, _.bind(function() {
        callback({
            'default': this.cache[sources.defaultCoverSrc],
            select: this.cache[sources.selectCoverSrc],
            lock: this.cache[sources.lockCoverSrc]
        });
    }, this));
};

Loader.prototype.sprites = function(puzzleId, rows, cols, callbackSprite, callbackFinish) {
    var self = this;
    var sprites = [];
    
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++)  {
            sprites.push({src: '/img/puzzles/' + puzzleId + '/' + i + '_' + j + '_pieces.png', row: i, col: j});
        }
    }

    flow.serialForEach(sprites, function(sprite) {
        this.src = sprite.src;
        this.row = sprite.row;
        this.col = sprite.col;
        self.images([sprite.src], this);
    }, function() {
        callbackSprite(this.row, this.col, self.cache[this.src]);
    }, function() {
        callbackFinish();
    });
};

window.Puzz.Loader = Loader;

})();