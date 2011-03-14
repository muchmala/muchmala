Puzzle.Layout = function(display, loading) {
    
    display.viewport();

    var content = display.viewport('content');

    content.draggable({
        containment: 'parent'
    });
    
    content.scraggable({
        sensitivity: 5,
        containment: 'parent'
    });
    
    function showLoading() {
        loading.show();
        loading.animate({top: 10}, 200);
    }

    function hideLoading() {
        loading.animate({top: -28}, 200, function() {
            loading.hide();
        });
    }

    $(window).resize(function() {
         display.viewport('update');
    });

    function arrange(pieceSize, vLength, hLength) {
        var step = Math.floor(pieceSize / 6);
        var rectSize = step * 4 + 1;
        var height = rectSize * vLength + step * 2;
        var width = rectSize * hLength + step * 2;

        display.viewport('size', height, width);
        display.viewport('update');
        content.scraggable('update');
    }

    return {
        viewport: content,
        showLoading: showLoading,
        hideLoading: hideLoading,
        arrange: arrange
    }
};