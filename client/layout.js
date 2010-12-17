BorbitPuzzle.layout = function(viewport, display, binder) {
    var offsetX = 0;
    var offsetY = 0;
    var viewportX = 0;
    var viewportY = 0;

    viewport.draggable({
        containment: 'parent',
        stop: function(event, ui) {
            offsetX = ui.position.top - viewportX;
            offsetY = ui.position.left - viewportY;
        }
    });

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
            viewportX = toInt(hDiff / 2);
            shouldBeDraggable = true;

            var top = viewportX + offsetX;
            var viewportOffsetTop = viewport.offset().top;
            var visibleHeight = viewportOffsetTop + viewportHeight;
            
            if(visibleHeight < displayHeight) {
                top = 0;
                offsetX += displayHeight - visibleHeight;
            }
            if(viewportOffsetTop >= 0) {
                top = binder.offset().top * -1;
            }
            viewport.css('top', top);
        } else {
            offsetY = 0;
            viewport.css('top', 0);
            binder.height(viewportHeight);
            binder.css('top', toInt(displayHeight / 2) -
                              toInt(viewportHeight / 2));
        }

        if(viewportWidth > displayWidth) {
            var wDiff = viewportWidth - displayWidth;
            binder.width(displayWidth + wDiff*2);
            binder.css('left', wDiff * -1);
            viewportY = toInt(wDiff / 2);
            shouldBeDraggable = true;

            var left = viewportY + offsetY;
            var viewportOffsetLeft = viewport.offset().left;
            var visibleWidth = viewportOffsetLeft + viewportWidth;

            if(visibleWidth < displayWidth) {
                left = 0;
                offsetY += displayWidth - visibleWidth;
            }
            if(viewportOffsetLeft >= 0) {
                left = binder.offset().left * -1;
            }
            viewport.css('left', left);
        } else {
            offsetX = 0;
            viewport.css('left', 0);
            binder.width(viewportWidth);
            binder.css('left', toInt(displayWidth / 2) -
                               toInt(viewportWidth / 2));
        }

        if(shouldBeDraggable) {        
            viewport.draggable('enable');
        } else {
            viewport.draggable('disable');
        }
    }

    renderView();

    $(window).resize(function() {
        renderView();
    });
};