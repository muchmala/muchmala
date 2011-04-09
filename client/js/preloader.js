window.Puzz = (function(ns) {

ns.Preloader = function() {
    this.cache = {};
};

ns.Preloader.prototype.loadImages = function(sources, callback) {
    var imagesCount = _.size(sources);
    var that = this;
    _.each(sources, function(src) {
        var image = new Image();
        image.src = src;
        image.onload = function() {
            that.cache[src] = image;
            if(--imagesCount == 0) {
                callback.call(null);
            }
        };
    });
};

return ns;

})(window.Puzz || {});