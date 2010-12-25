BorbitPuzzle.layout = function(elements) {
    var viewport = elements.viewport;
    var display = elements.display;
    var binder = elements.binder;

    var offsetX = 0,
        offsetY = 0,
        viewportX = 0,
        viewportY = 0,
        centerW = true,
        centerH = true,
        viewportHeight,
        viewportWidth;

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
        }
    });

    function arrange(width, height) {
        viewportHeight = height;
        viewportWidth = width;
        viewport.height(height);
        viewport.width(width);
        processArranging();
    }

    function processArranging() {
        var displayHeight = display.height();
        var displayWidth = display.width();
        
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
            centerH = true;
            viewport.css('top', 0);
            binder.height(viewportHeight);
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
            centerW = true;
            viewport.css('left', 0);
            binder.width(viewportWidth);
            binder.css('left', toInt(displayWidth / 2) -
                               toInt(viewportWidth / 2));
        }

        if(viewportHeight > displayHeight ||
           viewportWidth > displayWidth) {
            viewport.draggable('enable');
        } else {
            viewport.draggable('disable');
        }
    }

    function showLoading() {
        if(elements.loading) {
            elements.loading.animate({top: 0}, 200);
        }
    }

    function hideLoading() {
        if(elements.loading) {
            elements.loading.animate({top: -28}, 200);
        }
    }

    if(elements.panel) {
        var height = elements.panel.height();
        var initTop = (height - 30) * -1;
        var initRight = -30;
        elements.panel.css('top', initTop);
        elements.panel.css('right', initRight);
        elements.panel.show();

        elements.panel.click(function() {
            elements.panel.animate({
                right: 0,
                top: 0
            }, 200);
        });
        elements.panel.mouseleave(function() {
            elements.panel.animate({
                right: initRight,
                top: initTop
            }, 200);
        });
    }

    $(window).resize(function() {
        processArranging();
    });

    return {
        viewport: viewport,
        showLoading: showLoading,
        hideLoading: hideLoading,
        arrange: arrange
    }
};