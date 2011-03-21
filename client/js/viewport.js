Puzzle.Viewport = (function() {
    var element = $('#viewport');
    var loading =  $('#loading');

    element.viewport();

    var content = element.viewport('content');
    content.draggable({containment: 'parent'});
    content.scraggable({containment: 'parent'});
    
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
         element.viewport('update');
         content.scraggable('update');
    });

    function arrange(pieceSize, vLength, hLength) {
        var step = Math.floor(pieceSize / 6);
        var rectSize = step * 4 + 1;
        var height = rectSize * vLength + step * 2;
        var width = rectSize * hLength + step * 2;

        element.viewport('size', height, width);
        element.viewport('update');
        content.scraggable('update');
    }

    return {
        content: content,
        showLoading: showLoading,
        hideLoading: hideLoading,
        arrange: arrange
    }
})();