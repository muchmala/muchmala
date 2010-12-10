$(function() {

    var image = new Image();
    var viewport = $('#viewport');

    image.src = 'nodejs.png';
    
    image.onload = function() {
        buildPazzle();
    };

    function buildPazzle() {
        
        var piceSize = 90;
        var rectSize = toInt(piceSize / 3 * 2);
        var offsetX = toInt(((image.width - (rectSize / 2)) % rectSize) / 2);
        var offsetY = toInt(((image.height - (rectSize / 2)) % rectSize) / 2);

        var map = generatePuzzleMap(image.width, image.height, rectSize);

        for(var y = 0; y < map.length; y++) {
            for(var x = 0; x < map[y].length; x++) {
                
            }
        }
    }

    var puzzlePiceDrawer = (function() {
        var step, ctx, two = 2;

        function curve(cx, cy, x, y) {
            ctx.quadraticCurveTo(cx, cy, x, y);
        }

        function line(x, y) {
            ctx.lineTo(x, y);
        }

        function leftInnerCurve() {
            line(step, step*2.5-1);
            curve(step*two, step*two-1, step*two, step*3-1);
            curve(step*two, step*4+1, step, step*3.5+1);
        }

        function leftOuterCurve() {
            line(step, step*2.5+1);
            curve(0, step*two+1, 0, step*3+1);
            curve(0, step*4-1, step, step*3.5-1);
        }

        function bottomInnerCurve() {
            line(step*2.5-1, step*5);
            curve(step*two-1, step*4, step*3-1, step*4);
            curve(step*4+1, step*4, step*3.5+1, step*5);
        }

        function bottomOuterCurve() {
            line(step*2.5+1, step*5);
            curve(step*two+1, step*6, step*3+1, step*6);
            curve(step*4-1, step*6, step*3.5-1, step*5);
        }

        function rightInnerCurve() {
            line(step*5, step*3.5+1);
            curve(step*4, step*4+1, step*4, step*3+1);
            curve(step*4, step*two-1, step*5, step*2.5-1);
        }

        function rightOuterCurve() {
            line(step*5, step*3.5-1);
            curve(step*6, step*4-1, step*6, step*3-1);
            curve(step*6, step*two+1, step*5, step*2.5+1);
        }

        function topInnerCurve() {
            line(step*3.5+1, step);
            curve(step*4+1, step*2, step*3+1, step*2);
            curve(step*2-1, step*2, step*2.5-1, step);
        }

        function topOuterCurve() {
            line(step*3.5-1, step);
            curve(step*4-1, 0, step*3-1, 0);
            curve(step*2+1, 0, step*2.5+1, step);
        }

        function drawLines(ears) {
            ctx.beginPath();
            ctx.moveTo(step, step);

            if(ears.left) {
                leftOuterCurve();
            } else {
                leftInnerCurve();
            }

            line(step, step*5);

            if(ears.bottom) {
                bottomOuterCurve();
            } else {
                bottomInnerCurve();
            }

            line(step*5, step*5);

            if(ears.right) {
                rightOuterCurve();
            } else {
                rightInnerCurve();
            }

            line(step*5, step);

            if(ears.top) {
                topOuterCurve();
            } else {
                topInnerCurve();
            }

            line(step, step);
        }

        function draw(settings) {
            var imageX = settings.imageX;
            var imageY = settings.imageY;
            var width = settings.width;

            ctx = settings.ctx;
            image = settings.image;
            step = width / 6;

            drawLines(settings.ears);
            ctx.clip();
            ctx.drawImage(image, imageX, imageY, width, width, 0, 0, width, width);
        }

        function outline(settings) {
            drawLines(settings.ears);

            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgb(255,255,0)';
            ctx.stroke();
        }

        return {
            draw: draw,
            outline: outline
        };
    })();

    var puzzle = (function() {

        var piceSize, rectSize, offsetX, 
            offsetY, viewport, image;
        var index = [];
        var pices = [];

        function init(settings) {
            piceSize = settings.piceSize;
            rectSize = settings.rectSize;
            offsetX = settings.offsetX;
            offsetY = settings.offsetY;
            viewport = settings.viewport;
            image = settings.image;
        }

        function addPice(settings) {
            var pice = $.extend({
                x: null, y: null, tx: null, ty: null,
                l: null, b: null, r: null, t: null
            }, settings);

            pice.ix = pice.tx ? pice.tx * rectSize + offsetX : offsetX;
            pice.iy = pice.ty ? pice.ty * rectSize + offsetY : offsetY;
            pices.push(pice);
        }

        function drawPice(pice) {
            puzzlePiceDrawer.draw({
                ctx: pice.ctx,
                image: image,
                imageX: pice.ix,
                imageY: pice.iy,
                width: piceSize,
                ears: {
                    left: pice.l, bottom: pice.b,
                    right: pice.r, top: pice.t
                }
            });
        }

        function buildPice(pice) {
            var canvas = document.createElement('canvas');
            canvas.height = piceSize;
            canvas.width = piceSize;
            canvas.style.position = 'absolute';
            canvas.style.top = (pice.y ? pice.y * (rectSize + 1) : 0) + 'px';
            canvas.style.left = (pice.x ? pice.x * (rectSize + 1) : 0) + 'px';
            viewport.appendChild(canvas);
            pice.ctx = canvas.getContext('2d');
        }

        function buildField() {
            for(var i = 0, len = pices.length; i < len; i++) {
                buildPice(pices[i]);
                drawPice(pices[i]);
            }
        }

        return {
            init: init,
            addPice: addPice,
            buildField: buildField
        };

    })();
});