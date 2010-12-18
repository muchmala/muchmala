BorbitPuzzle.layout = function(viewport, display, binder) {

    var offsetX = 0,
        offsetY = 0,
        viewportX = 0,
        viewportY = 0,
        centerW = true,
        centerH = true,
        displayHeight, displayWidth,
        viewportHeight = viewport.height(),
        viewportWidth = viewport.width();

    viewport.draggable({
        containment: 'parent',
        stop: function(event, ui) {
            if(viewportX != ui.position.top) {
                centerH = false;
            }
            if(viewportY != ui.position.left) {
                centerW = false;
            }

            viewportX = ui.position.top;
            viewportY = ui.position.left;

            if(viewportHeight > displayHeight ||
               viewportWidth > displayWidth) {
                viewport.draggable('enable');
            } else {
                viewport.draggable('disable');
            }
        }
    });

    function renderView() {
        displayHeight = display.height();
        displayWidth = display.width();

        if(viewportHeight > displayHeight) {
            var hDiff = viewportHeight - displayHeight;
            binder.height(displayHeight + hDiff*2);
            binder.css('top', hDiff * -1);

            if(centerH) {
                viewportX = toInt(hDiff / 2);
                viewport.css('top', viewportX);
            } else {
                var newX = viewportX - (hDiff - offsetX)*-1;
                if(newX >= 0) {
                    viewport.css('top', newX);
                    viewportX = newX;
                }

            }
            offsetX = hDiff;
        } else {
            if(!centerH) {
                centerH = true;
                viewport.css('top', 0);
                binder.height(viewportHeight);
            }
            binder.css('top', toInt(displayHeight / 2) -
                              toInt(viewportHeight / 2));
        }

        if(viewportWidth > displayWidth) {
            var wDiff = viewportWidth - displayWidth;
            binder.width(displayWidth + wDiff*2);
            binder.css('left', wDiff * -1);

            if(centerW) {
                viewportY = toInt(wDiff / 2);
                viewport.css('left', viewportY);
            } else {
                var newY = viewportY - (wDiff - offsetY)*-1;
                if(newY >= 0) {
                    viewport.css('left', newY);
                    viewportY = newY;
                }
            }
            offsetY = wDiff;
        } else {
            if(!centerW) {
                centerW = true;
                viewport.css('left', 0);
                binder.width(viewportWidth);
            }
            binder.css('left', toInt(displayWidth / 2) -
                               toInt(viewportWidth / 2));
        }
    }

    renderView();

    $(window).resize(function() {
        renderView();
    });
};