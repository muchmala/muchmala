var fs = require('fs');
var flow = require('../shared/flow');
var _ = require('../shared/underscore')._;
var Canvas = require('canvas');

var PIECES_MAP_FILENAME = 'pieces.png';
var DEFAULT_COVERS_FILENAME = 'default_covers.png';
var SELECT_COVERS_FILENAME = 'select_covers.png';
var LOCK_COVERS_FILENAME = 'lock_covers.png';

var DEFAULT_COVER_COLOR = 'rgba(255,255,255,0.3)';
var SELECT_COVER_COLOR = 'rgba(0,0,255,0.7)';
var LOCK_COVER_COLOR = 'rgba(255,0,0,0.7)';

var COVERS_MAP = [
    {x: 0, y: 0, ears: {left: 0, top: 0, right: 0, bottom: 0}},
    {x: 1, y: 0, ears: {left: 1, top: 1, right: 1, bottom: 1}},
    {x: 2, y: 0, ears: {left: 1, top: 0, right: 0, bottom: 0}},
    {x: 3, y: 0, ears: {left: 0, top: 1, right: 0, bottom: 0}},
    {x: 0, y: 1, ears: {left: 0, top: 0, right: 1, bottom: 0}},
    {x: 1, y: 1, ears: {left: 0, top: 0, right: 0, bottom: 1}},
    {x: 2, y: 1, ears: {left: 1, top: 1, right: 1, bottom: 0}},
    {x: 3, y: 1, ears: {left: 0, top: 1, right: 1, bottom: 1}},
    {x: 0, y: 2, ears: {left: 1, top: 1, right: 0, bottom: 1}},
    {x: 1, y: 2, ears: {left: 1, top: 0, right: 1, bottom: 1}},
    {x: 2, y: 2, ears: {left: 1, top: 1, right: 0, bottom: 0}},
    {x: 3, y: 2, ears: {left: 0, top: 0, right: 1, bottom: 1}},
    {x: 0, y: 3, ears: {left: 0, top: 1, right: 1, bottom: 0}},
    {x: 1, y: 3, ears: {left: 1, top: 0, right: 0, bottom: 1}},
    {x: 2, y: 3, ears: {left: 0, top: 1, right: 0, bottom: 1}},
    {x: 3, y: 3, ears: {left: 1, top: 0, right: 1, bottom: 0}}
];

function Cutter(settings) {
    var image = settings.image,
        piecesMap = settings.piecesMap,
        piceSize = settings.pieceSize,
        spriteSize = settings.spriteSize,
        step = Math.floor(piceSize / 6),
        width = piceSize * settings.hLength,
        height = piceSize * settings.vLength;

    cut(settings.onFinish);

    function leftInnerCurve(ctx) {
        ctx.lineTo(step, step*2.5-1);
        ctx.quadraticCurveTo(step*2, step*2-1, step*2, step*3-1);
        ctx.quadraticCurveTo(step*2, step*4+1, step, step*3.5+1);
    }

    function leftOuterCurve(ctx) {
        ctx.lineTo(step, step*2.5+1);
        ctx.quadraticCurveTo(0, step*2+1, 0, step*3+1);
        ctx.quadraticCurveTo(0, step*4-1, step, step*3.5-1);
    }

    function bottomInnerCurve(ctx) {
        ctx.lineTo(step*2.5-1, step*5);
        ctx.quadraticCurveTo(step*2-1, step*4, step*3-1, step*4);
        ctx.quadraticCurveTo(step*4+1, step*4, step*3.5+1, step*5);
    }

    function bottomOuterCurve(ctx) {
        ctx.lineTo(step*2.5+1, step*5);
        ctx.quadraticCurveTo(step*2+1, step*6, step*3+1, step*6);
        ctx.quadraticCurveTo(step*4-1, step*6, step*3.5-1, step*5);
    }

    function rightInnerCurve(ctx) {
        ctx.lineTo(step*5, step*3.5+1);
        ctx.quadraticCurveTo(step*4, step*4+1, step*4, step*3+1);
        ctx.quadraticCurveTo(step*4, step*2-1, step*5, step*2.5-1);
    }

    function rightOuterCurve(ctx) {
        ctx.lineTo(step*5, step*3.5-1);
        ctx.quadraticCurveTo(step*6, step*4-1, step*6, step*3-1);
        ctx.quadraticCurveTo(step*6, step*2+1, step*5, step*2.5+1);
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

    function drawPiecePath(ctx, ears) {
        ctx.beginPath();

        ctx.moveTo(step, step);
        if(ears.left) leftOuterCurve(ctx); else leftInnerCurve(ctx);

        ctx.lineTo(step, step*5);
        if(ears.bottom) bottomOuterCurve(ctx); else bottomInnerCurve(ctx);

        ctx.lineTo(step*5, step*5);
        if(ears.right) rightOuterCurve(ctx); else rightInnerCurve(ctx);

        ctx.lineTo(step*5, step);
        if(ears.top) topOuterCurve(ctx); else topInnerCurve(ctx);

        ctx.lineTo(step, step);
    }

    function cut(callback) {
        flow.exec(
            function() {
                fs.mkdir(settings.resultDir, 0777, this.MULTI());

                createCovers(DEFAULT_COVER_COLOR, DEFAULT_COVERS_FILENAME, this.MULTI());
                createCovers(SELECT_COVER_COLOR, SELECT_COVERS_FILENAME, this.MULTI());
                createCovers(LOCK_COVER_COLOR, LOCK_COVERS_FILENAME, this.MULTI());
                
                createPieces(this.MULTI());
            },
            function() {
                callback.call(null);
            }
        );
    }

    function createPieces(callback) {
        var mapCanvas = new Canvas(width, height),
            mapCtx = mapCanvas.getContext('2d'),
            sprites = [];
        
        piecesMap.forEach(function(piece) {
            var imageX = piece.x * (piceSize - step*2);
            var imageY = piece.y * (piceSize - step*2);
            var destnX = piece.x * piceSize;
            var destnY = piece.y * piceSize;

            var pieceCanvas = new Canvas(piceSize, piceSize);
            var pieceCtx = pieceCanvas.getContext('2d');

            drawPiecePath(pieceCtx, {
                top: piece.top,
                left: piece.left,
                right: piece.right,
                bottom: piece.bottom
            });

            pieceCtx.clip();
            pieceCtx.drawImage(image, imageX, imageY, piceSize, piceSize, 0, 0, piceSize, piceSize);
            mapCtx.drawImage(pieceCanvas, 0, 0, piceSize, piceSize, destnX, destnY, piceSize, piceSize);
        });

        for (var i = 0, row = 0; i < settings.vLength; i += spriteSize, row++) {
            for (var j = 0, col = 0; j < settings.hLength; j += spriteSize, col++) {
                var hPiecesCountLeft = settings.hLength - j;
                var vPiecesCountLeft = settings.vLength - i;
                var spriteWidth = (hPiecesCountLeft >= spriteSize ? spriteSize : hPiecesCountLeft) * piceSize;
                var spriteHeight = (vPiecesCountLeft >= spriteSize ? spriteSize : vPiecesCountLeft) * piceSize;

                var spriteCanvas = new Canvas(spriteWidth, spriteHeight);
                var spriteCtx = spriteCanvas.getContext('2d');

                spriteCtx.drawImage(mapCanvas, j*piceSize, i*piceSize, spriteWidth,
                                    spriteHeight, 0, 0, spriteWidth, spriteHeight);

                sprites.push({
                    canvas: spriteCanvas,
                    row: row, col: col
                });
            }
        }

        flow.serialForEach(sprites, function(sprite) {
            var fileName = sprite.row + '_' + sprite.col + '_' + PIECES_MAP_FILENAME;

            flow.exec(function() {
                sprite.canvas.toBuffer(this);
            }, function(err, buffer) {
                fs.writeFile(settings.resultDir + '/' + fileName, buffer, this);
            }, this);

            this.fileName = fileName;
        }, function() {
            console.log('Created ' + this.fileName + '...');
        }, function() {
            callback();
        });
    }

    function createCovers(color, resultFilename, callback) {
        var coversCanvas = new Canvas(piceSize * 4, piceSize * 4);
        var coversCtx = coversCanvas.getContext('2d');
            
        COVERS_MAP.forEach(function(cover) {
            var coverCanvas = new Canvas(piceSize, piceSize);
            var coverCtx = coverCanvas.getContext('2d');
            var destnX = cover.x * piceSize;
            var destnY = cover.y * piceSize;
            
            drawPiecePath(coverCtx, cover.ears);
            coverCtx.fillStyle = color;
            coverCtx.fill();

            coversCtx.drawImage(coverCanvas, 0, 0, piceSize, piceSize, destnX, destnY, piceSize, piceSize);
        });

        coversCanvas.toBuffer(function(err, buffer){
            fs.writeFile(settings.resultDir + '/' + resultFilename, buffer, callback);
        });
    }
}

exports.cut = Cutter;