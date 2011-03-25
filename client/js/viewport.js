Puzz.Viewport = (function() {
    var element = $('#viewport').viewport();
    var content = element.viewport('content');
    content.draggable({containment: 'parent'});
    content.scraggable({containment: 'parent'});

    $(window).resize(function() {
         element.viewport('adjust');
    });

    function arrange(pieceSize, vLength, hLength) {
        var step = Math.floor(pieceSize / 6);
        var rectSize = step * 4 + 1;
        var height = rectSize * vLength + step * 2;
        var width = rectSize * hLength + step * 2;

        element.viewport('size', height, width);
        element.viewport('update');
    }

    return {
        content: content,
        arrange: arrange
    };
})();