window.Puzz = (function(ns) {

function Preloader() {
    this.cache = {};
}

Preloader.prototype.loadImages = function(sources, callback) {
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

ns.Preloader = Preloader;

return ns;

})(window.Puzz || {});