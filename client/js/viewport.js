var Puzz = (function(ns) {

ns.Viewport = function() {
    this.element = $('#viewport').viewport();
    this.content = this.element.viewport('content');

    this.content.draggable({
        containment: 'parent'
    });
    this.content.scraggable({
        containment: 'parent',
        sensitivity: 10
    });

    $(window).resize(_.bind(function() {
         this.element.viewport('adjust');
    }, this));
}

ns.Viewport.prototype.arrange = function(pieceSize, vLength, hLength) {
    var step = Math.floor(pieceSize / 6);
    var rectSize = step * 4 + 1;
    var height = rectSize * vLength + step * 2;
    var width = rectSize * hLength + step * 2;

    this.element.viewport('size', height, width);
    this.element.viewport('update');
};

return ns;

})(Puzz || {});