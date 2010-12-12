BorbitPuzzle = {};

BorbitPuzzle.piceDrawer = function(settings) {
    var image = settings.image;
    var piceSize = settings.piceSize;
    var step = toInt(piceSize / 6);
    var two = 2;

    function leftInnerCurve(ctx) {
        ctx.lineTo(step, step*2.5-1);
        ctx.quadraticCurveTo(step*two, step*two-1, step*two, step*3-1);
        ctx.quadraticCurveTo(step*two, step*4+1, step, step*3.5+1);
    }

    function leftOuterCurve(ctx) {
        ctx.lineTo(step, step*2.5+1);
        ctx.quadraticCurveTo(0, step*two+1, 0, step*3+1);
        ctx.quadraticCurveTo(0, step*4-1, step, step*3.5-1);
    }

    function bottomInnerCurve(ctx) {
        ctx.lineTo(step*2.5-1, step*5);
        ctx.quadraticCurveTo(step*two-1, step*4, step*3-1, step*4);
        ctx.quadraticCurveTo(step*4+1, step*4, step*3.5+1, step*5);
    }

    function bottomOuterCurve(ctx) {
        ctx.lineTo(step*2.5+1, step*5);
        ctx.quadraticCurveTo(step*two+1, step*6, step*3+1, step*6);
        ctx.quadraticCurveTo(step*4-1, step*6, step*3.5-1, step*5);
    }

    function rightInnerCurve(ctx) {
        ctx.lineTo(step*5, step*3.5+1);
        ctx.quadraticCurveTo(step*4, step*4+1, step*4, step*3+1);
        ctx.quadraticCurveTo(step*4, step*two-1, step*5, step*2.5-1);
    }

    function rightOuterCurve(ctx) {
        ctx.lineTo(step*5, step*3.5-1);
        ctx.quadraticCurveTo(step*6, step*4-1, step*6, step*3-1);
        ctx.quadraticCurveTo(step*6, step*two+1, step*5, step*2.5+1);
    }

    function topInnerCurve(ctx) {
        ctx.lineTo(step*3.5+1, step);
        ctx.quadraticCurveTo(step*4+1, step*2, step*3+1, step*2);
        ctx.quadraticCurveTo(step*2-1, step*2, step*2.5-1, step);
    }

    function topOuterCurve(ctx) {
        ctx.lineTo(step*3.5-1, step);
        ctx.quadraticCurveTo(step*4-1, 0, step*3-1, 0);
        ctx.quadraticCurveTo(step*2+1, 0, step*2.5+1, step);
    }

    function drawPath(ctx, ears) {
        ctx.beginPath();
        ctx.moveTo(step, step);

        if(ears.left) {
            leftOuterCurve(ctx);
        } else {
            leftInnerCurve(ctx);
        }

        ctx.lineTo(step, step*5);

        if(ears.bottom) {
            bottomOuterCurve(ctx);
        } else {
            bottomInnerCurve(ctx);
        }

        ctx.lineTo(step*5, step*5);

        if(ears.right) {
            rightOuterCurve(ctx);
        } else {
            rightInnerCurve(ctx);
        }

        ctx.lineTo(step*5, step);

        if(ears.top) {
            topOuterCurve(ctx);
        } else {
            topInnerCurve(ctx);
        }

        ctx.lineTo(step, step);
    }

    function draw(settings) {
        drawPath(settings.ctx, settings.ears);
        settings.ctx.clip();
        settings.ctx.drawImage(image, settings.imageX, settings.imageY,
                               piceSize, piceSize, 0, 0, piceSize, piceSize);
    }

    function highlight(settings) {
        drawPath(settings.ctx, settings.ears);
        settings.ctx.lineWidth = 3;
        settings.ctx.strokeStyle = 'rgb(255,0,0)';
        settings.ctx.fillStyle = 'rgba(255,0,0,0.2)';
        settings.ctx.stroke();
        settings.ctx.fill();
    }

    return {
        draw: draw,
        highlight: highlight
    };
};