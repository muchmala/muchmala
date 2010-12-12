$(function() {

    var image1 = new Image();
    image1.src = 'nodejs.png';
    image1.onload = function() {
        buildPazzle(image1, $('#viewport_nodejs'), 90);
    };

    var image2 = new Image();
    image2.src = 'javascript.jpg';
    image2.onload = function() {
        buildPazzle(image2, $('#viewport_javascript'), 60);
    };


    function buildPazzle(image, viewport, piceSize) {
        var rectSize = toInt(piceSize / 3 * 2);
        var offsetX = toInt(((image.width - (rectSize / 2)) % rectSize) / 2);
        var offsetY = toInt(((image.height - (rectSize / 2)) % rectSize) / 2);

        var field = BorbitPuzzle.fileld({
            viewport: viewport,
            piceSize: piceSize,
            rectSize: rectSize,
            indexCellSize: rectSize
        });
        var pices = BorbitPuzzle.pices({
            piceSize: piceSize,
            rectSize: rectSize,
            image: image
        });

        var map = generatePuzzleMap(image.width, image.height, rectSize);

        for(var y = 0; y < map.length; y++) {
            for(var x = 0; x < map[y].length; x++) {

                var data = map[y][x];
                var pice = pices.factory({
                    ix: data.x ? data.x * rectSize + offsetX : offsetX,
                    iy: data.y ? data.y * rectSize + offsetY : offsetY,
                    tx: data.x, ty: data.y,
                    l: data.l, b: data.b,
                    r: data.r, t: data.t,
                    x: x, y: y
                });

                field.addPice(pice);
            }
        }

        field.build();
    }
});