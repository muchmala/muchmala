Puzzle.Preloader = function() {
    this.cache = [];
};

Puzzle.Preloader.prototype.loadImages = function(sources, callback) {
    var imagesCount = _.size(sources);
    var that = this;
    _.each(sources, function(src) {
        var image = new Image();
        image.src = src;
        image.onload = function() {
            that.cache.push(image);
            if(--imagesCount == 0) {
                callback.call(null);
            }
        };
    });
};