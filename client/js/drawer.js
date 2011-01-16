Puzzle = {};

Puzzle.piceDrawer = function(settings) {
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
        var imageX = settings.x * (piceSize - step*2);
        var imageY = settings.y * (piceSize - step*2);
        settings.ctx.clearRect(0, 0, piceSize, piceSize);
        drawPath(settings.ctx, settings.ears);
        settings.ctx.clip();
        settings.ctx.drawImage(image, imageX, imageY, piceSize, piceSize,
                                0, 0, piceSize, piceSize);
    }

    function select(settings) {
        drawPath(settings.ctx, settings.ears);
        settings.ctx.fillStyle = 'rgba(0,0,255,0.7)';
        settings.ctx.fill();
    }

    function lock(settings) {
        var center = toInt(piceSize / 2);
        drawPath(settings.ctx, settings.ears);
        settings.ctx.fillStyle = 'rgba(255,0,0,0.7)';
        settings.ctx.fill();
        settings.ctx.fillStyle = 'rgb(255,255,255)';
        settings.ctx.beginPath();
        settings.ctx.fillRect(center-5, center-9, 2, 4);
        settings.ctx.fillRect(center+3, center-9, 2, 4);
        settings.ctx.fillRect(center-3, center-11, 6, 2);
        settings.ctx.fillRect(center-7, center-5, 14, 12);
        settings.ctx.fillRect(center-5, center+7, 10, 2);
        settings.ctx.fillStyle = 'rgb(255,0,0)';
        settings.ctx.fillRect(center-1, center, 2, 4);
    }

    function cover(settings) {
        var center = toInt(piceSize / 2);
        drawPath(settings.ctx, settings.ears);
        settings.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        settings.ctx.fill();        
    }

    return {
        draw: draw,
        lock: lock,
        cover: cover,
        select: select
    };
};