var fs = require('fs');
var flow = require('../../shared/flow');
var _ = require('../../shared/underscore')._;
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

function leftInnerCurve(ctx, step) {
    ctx.lineTo(step, step*2.5-1);
    ctx.quadraticCurveTo(step*2, step*2-1, step*2, step*3-1);
    ctx.quadraticCurveTo(step*2, step*4+1, step, step*3.5+1);
}

function leftOuterCurve(ctx, step) {
    ctx.lineTo(step, step*2.5+1);
    ctx.quadraticCurveTo(0, step*2+1, 0, step*3+1);
    ctx.quadraticCurveTo(0, step*4-1, step, step*3.5-1);
}

function bottomInnerCurve(ctx, step) {
    ctx.lineTo(step*2.5-1, step*5);
    ctx.quadraticCurveTo(step*2-1, step*4, step*3-1, step*4);
    ctx.quadraticCurveTo(step*4+1, step*4, step*3.5+1, step*5);
}

function bottomOuterCurve(ctx, step) {
    ctx.lineTo(step*2.5+1, step*5);
    ctx.quadraticCurveTo(step*2+1, step*6, step*3+1, step*6);
    ctx.quadraticCurveTo(step*4-1, step*6, step*3.5-1, step*5);
}

function rightInnerCurve(ctx, step) {
    ctx.lineTo(step*5, step*3.5+1);
    ctx.quadraticCurveTo(step*4, step*4+1, step*4, step*3+1);
    ctx.quadraticCurveTo(step*4, step*2-1, step*5, step*2.5-1);
}

function rightOuterCurve(ctx, step) {
    ctx.lineTo(step*5, step*3.5-1);
    ctx.quadraticCurveTo(step*6, step*4-1, step*6, step*3-1);
    ctx.quadraticCurveTo(step*6, step*2+1, step*5, step*2.5+1);
}

function topInnerCurve(ctx, step) {
    ctx.lineTo(step*3.5+1, step);
    ctx.quadraticCurveTo(step*4+1, step*2, step*3+1, step*2);
    ctx.quadraticCurveTo(step*2-1, step*2, step*2.5-1, step);
}

function topOuterCurve(ctx, step) {
    ctx.lineTo(step*3.5-1, step);
    ctx.quadraticCurveTo(step*4-1, 0, step*3-1, 0);
    ctx.quadraticCurveTo(step*2+1, 0, step*2.5+1, step);
}

function drawPiecePath(ctx, step, ears) {
    ctx.beginPath();

    ctx.moveTo(step, step);
    if(ears.left) leftOuterCurve(ctx, step); else leftInnerCurve(ctx, step);

    ctx.lineTo(step, step*5);
    if(ears.bottom) bottomOuterCurve(ctx, step); else bottomInnerCurve(ctx, step);

    ctx.lineTo(step*5, step*5);
    if(ears.right) rightOuterCurve(ctx, step); else rightInnerCurve(ctx, step);

    ctx.lineTo(step*5, step);
    if(ears.top) topOuterCurve(ctx, step); else topInnerCurve(ctx, step);

    ctx.lineTo(step, step);
}


function createPieces(settings) {
    var image = settings.image,
        piceSize   = settings.pieceSize,
        spriteSize = settings.spriteSize,
        piecesMap  = settings.piecesMap;
    
    var step = Math.floor(piceSize / 6);
        
    fs.mkdir(settings.resultDir, 0777, function() {
        var mapCanvas = new Canvas(piceSize * settings.hLength, 
                                   piceSize * settings.vLength);
        var mapCtx = mapCanvas.getContext('2d');
        
        var rows = Math.ceil(settings.vLength / spriteSize);
        var cols = Math.ceil(settings.hLength / spriteSize);
    
        flow.serialForEach(_.range(rows), function(row) {
        flow.serialForEach(_.range(cols), function(col) {
            
            var hPiecesCountLeft = settings.hLength - col * spriteSize;
            var vPiecesCountLeft = settings.vLength - row * spriteSize;
            var spriteWidth = (hPiecesCountLeft >= spriteSize ? spriteSize : hPiecesCountLeft) * piceSize;
            var spriteHeight = (vPiecesCountLeft >= spriteSize ? spriteSize : vPiecesCountLeft) * piceSize;

            var spriteCanvas = new Canvas(spriteWidth, spriteHeight);
            var spriteCtx = spriteCanvas.getContext('2d');
            
            var pieces = _.select(piecesMap, function(piece) {
                return piece.x >= spriteSize * col && piece.x <= spriteSize * col + spriteSize &&
                       piece.y >= spriteSize * row && piece.y <= spriteSize * row + spriteSize;
            });
            
            _.each(pieces, function(piece) {
                var imageX = piece.x * (piceSize - step*2);
                var imageY = piece.y * (piceSize - step*2);
                var destnX = (piece.x - col * spriteSize) * piceSize;
                var destnY = (piece.y - row * spriteSize) * piceSize;

                var pieceCanvas = new Canvas(piceSize, piceSize);
                var pieceCtx = pieceCanvas.getContext('2d');

                drawPiecePath(pieceCtx, step, {
                    top: piece.top,
                    left: piece.left,
                    right: piece.right,
                    bottom: piece.bottom
                });

                pieceCtx.clip();
                pieceCtx.drawImage(image, imageX, imageY, piceSize, piceSize, 0, 0, piceSize, piceSize);
                spriteCtx.drawImage(pieceCanvas, 0, 0, piceSize, piceSize, destnX, destnY, piceSize, piceSize);
            });
                            
            var fileName = row + '_' + col + '_' + PIECES_MAP_FILENAME;

            flow.exec(function() {
                spriteCanvas.toBuffer(this);
            }, function(err, buffer) {
                fs.writeFile(settings.resultDir + '/' + fileName, buffer, this);
                if (settings.verbose) {
                    console.log('Created ' + fileName + '...');
                }
            }, this);

        }, function() {}, this);
        }, function() {}, settings.onFinish);
    });
}

function createCovers(color, filepath, size, callback) {
    var coversCanvas = new Canvas(size * 4, size * 4);
    var coversCtx = coversCanvas.getContext('2d');
    var step = Math.floor(size / 6);
        
    COVERS_MAP.forEach(function(cover) {
        var coverCanvas = new Canvas(size, size);
        var coverCtx = coverCanvas.getContext('2d');
        var destnX = cover.x * size;
        var destnY = cover.y * size;
        
        drawPiecePath(coverCtx, step, cover.ears);
        coverCtx.fillStyle = color;
        coverCtx.fill();

        coversCtx.drawImage(coverCanvas, 0, 0, size, size, destnX, destnY, size, size);
    });

    coversCanvas.toBuffer(function(err, buffer){
        fs.writeFile(filepath, buffer, callback);
    });
}

exports.createPieces = createPieces;
exports.createCovers = function(size, dirpath, callback) {
    flow.exec(function() {
        fs.mkdir(dirpath, 0777, this);
    }, function() {
        createCovers(DEFAULT_COVER_COLOR, dirpath + '/' + DEFAULT_COVERS_FILENAME, size, this.MULTI());
        createCovers(SELECT_COVER_COLOR, dirpath + '/' + SELECT_COVERS_FILENAME, size, this.MULTI());
        createCovers(LOCK_COVER_COLOR, dirpath + '/' + LOCK_COVERS_FILENAME, size, this.MULTI());
    }, callback);
};