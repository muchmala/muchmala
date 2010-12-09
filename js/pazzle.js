$(function() {

    var image = new Image();

    image.src = 'lost.jpg';
    
    image.onload = function() {
        var piceSize = 90;
        var rectSize = toInt(piceSize / 3 * 2);
        var offsetX = toInt(((image.width - (rectSize / 2)) % rectSize) / 2);
        var offsetY = toInt(((image.height - (rectSize / 2)) % rectSize) / 2);

        var map = generatePuzzleMap(image.width, image.height, rectSize);
        
        for(var y = 0; y < map.length; y++) {
            for(var x = 0; x < map[y].length; x++) {
                var imageX = map[y][x].x ? map[y][x].x * (piceSize - 40) + offsetX : offsetX;
                var imageY = map[y][x].y ? map[y][x].y * (piceSize - 40) + offsetY : offsetY;

                var ctx = appendCanvas(
                    piceSize,
                    (y ? y * (rectSize + 1) : 0),
                    (x ? x * (rectSize + 1) : 0)
                );
                
                puzzlePiceDrawer({
                    ctx: ctx,
                    image: image,
                    imageX: imageX,
                    imageY: imageY,
                    width: piceSize,
                    ears: {
                        left: map[y][x].l,
                        bottom: map[y][x].b,
                        right: map[y][x].r,
                        top: map[y][x].t
                    }
                });
            }
        }
    };

    function appendCanvas(size, top, left) {
        var canvas = document.createElement('canvas');
        canvas.height = size;
        canvas.width = size;
        canvas.style.position = 'absolute';
        canvas.style.top = top + 'px';
        canvas.style.left = left + 'px';
        document.body.appendChild(canvas);
        
        return canvas.getContext('2d');
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

        return function(settings) {
            var imageX = settings.imageX;
            var imageY = settings.imageY;
            var width = settings.width;

            ctx = settings.ctx;
            image = settings.image;
            step = width / 6;

            drawLines(settings.ears);
            ctx.clip();
            ctx.drawImage(image, imageX, imageY, width, width, 0, 0, width, width);
/*
            ctx.beginPath();
            drawLeftBottomLines(settings.ears);

            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgb(255,255,255)';
            ctx.stroke();

            ctx.beginPath();
            drawRightTopLines(settings.ears);

            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgb(255,255,0)';
            ctx.stroke();
*/   
        };
        
    })();
});