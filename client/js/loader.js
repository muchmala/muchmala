(function() {

function Loader() {
    this.cache = {};
}

var Proto = Loader.prototype;

Proto.images = function(sources, callback) {
    var self = this;
    
    flow.serialForEach(_.toArray(sources), function(src) {
        this.src = src;
        this.image = new Image();
        this.image.src = window.STATIC_HOST + this.src;
        this.image.onload = this;
    }, function() {
        self.cache[this.src] = this.image;
    }, function() {
        callback.call(null);
    });
};

Proto.covers = function(pieceSize, callback) {
    var sources = {
        defaultCoverSrc: '/img/covers/' + pieceSize + '/default_covers.png',
        selectCoverSrc: '/img/covers/' + pieceSize + '/select_covers.png',
        lockCoverSrc: '/img/covers/' + pieceSize + '/lock_covers.png'
    };

    this.images(sources, _.bind(function() {
        callback({
            'default': this.cache[sources.defaultCoverSrc],
            select: this.cache[sources.selectCoverSrc],
            lock: this.cache[sources.lockCoverSrc]
        });
    }, this));
};

Proto.sprites = function(puzzleId, rows, cols, callbackSprite, callbackFinish) {
    var dir = '/img/puzzles/' + puzzleId + '/';
    var count = rows * cols;
    var self = this;
    
    for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
        (function(src, row, col) {
            self.images([src], function() {
                callbackSprite(row, col, self.cache[src]);
                if (!--count) {
                    callbackFinish();
                }
            });
        })(dir + i + '_' + j + '_pieces.png', i, j);
    }}
};

window.Puzz.Loader = Loader;

})();