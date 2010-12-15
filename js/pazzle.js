$(function() {

    var viewport = $('#viewport');
    var display = $('#display');
    var binder = $('#binder');

    function renderView() {
        var shouldBeDraggable = false;
        var displayHeight = display.height();
        var displayWidth = display.width();
        var viewportHeight = viewport.height();
        var viewportWidth = viewport.width();

        if(viewportHeight > displayHeight) {
            var hDiff = viewportHeight - displayHeight;
            binder.height(displayHeight + hDiff*2);
            binder.css('top', hDiff * -1);
            viewport.css('top', toInt(hDiff / 2));
            shouldBeDraggable = true;
        } else {
            viewport.css('top', 0);
            binder.height(viewportHeight);
            binder.css('top', toInt(displayHeight / 2) -
                              toInt(viewportHeight / 2));
        }

        if(viewportWidth > displayWidth) {
            var wDiff = viewportWidth - displayWidth;
            binder.width(displayWidth + wDiff*2);
            binder.css('left', wDiff * -1);
            viewport.css('left', toInt(wDiff / 2));
            shouldBeDraggable = true;
        } else {
            viewport.css('left', 0);
            binder.width(viewportWidth);
            binder.css('left', toInt(displayWidth / 2) -
                               toInt(viewportWidth / 2));
        }

        if(shouldBeDraggable) {
            viewport.draggable({containment: 'parent'});
        }
    }

    renderView();

    $(window).resize(renderView);
    
    var image = new Image();
    image.src = 'lost.jpg';
    image.onload = function() {
        var server = BorbitPuzzle.server();
        var controller = BorbitPuzzle.controller(server, {
            viewport: viewport,
            image: image
        });
    };
});