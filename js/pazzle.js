$(function() {

    var viewport = $('#viewport');
    var display = $('#display');
    var binder = $('#binder');

    function renderView() {
        var displayHeight = display.height();
        var displayWidth = display.width();
        var hDiff = viewport.height() - displayHeight;
        var wDiff = viewport.width() - displayWidth;

        binder.width(displayWidth + wDiff*2);
        binder.height(displayHeight + hDiff*2);

        binder.css({
            top: hDiff * -1,
            left: wDiff * -1
        });

        viewport.css({
            top: toInt(hDiff / 2),
            left: toInt(wDiff / 2)
        });
    }

    viewport.draggable({containment: 'parent'});
    renderView();
    
    var image1 = new Image();
    image1.src = 'lost.jpg';
    image1.onload = function() {
        buildPazzle(image1, viewport, 90);
    };

    function buildPazzle(image, viewport, piceSize) {
        
        var field = BorbitPuzzle.fileld({
            piceSize: piceSize,
            viewport: viewport
        });
        
        var pices = BorbitPuzzle.pices({
            piceSize: piceSize,
            image: image
        });

        var map = generatePuzzleMap(image.width, image.height, piceSize);

        for(var y = 0; y < map.length; y++) {
            for(var x = 0; x < map[y].length; x++) {

                var data = map[y][x];
                var pice = pices.factory({
                    tx: data.x, ty: data.y,
                    l: data.l, b: data.b,
                    r: data.r, t: data.t
                });

                field.addPice(x, y, pice);
            }
        }

        field.build();
    }
});