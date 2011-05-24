var db = require('../db'),
    path = require('path'),
    opts = require('opts'),
    Image = require('canvas').Image,
    cutter = require('./cutter'),
    random = require('./random');

var PUZZLES_DIR = __dirname + '/../client/img/puzzles/';

var SUCCESS = 1;

var ERROR_IMAGE_BIG = 101;
var ERROR_IMAGE_SMALL = 102;

var MAX_IMAGE_HEIGHT = 2500;
var MAX_IMAGE_WIDTH = 2500;
var MIN_IMAGE_HEIGHT = 500;
var MIN_IMAGE_WIDTH = 500;

var options = [
    {
        'short': 'i',
        'long': 'image',
        'description': 'Image a puzzle will be created from',
        'value': true,
        'required': true
    }, {
        'short': 'n',
        'long': 'name',
        'description': 'Puzzle name',
        'value': true
    }, {
        'short': 'ps',
        'long': 'piecesize',
        'description': 'Piece size',
        'value': true
    }, {
        'short': 'ss',
        'long': 'spritesize',
        'description': 'Sprite size',
        'value': true
    }, {
        'short': 'p',
        'long': 'private',
        'description': 'Is puzzle private',
        'value': false
    }, {
        'short': 'u',
        'long': 'userid',
        'description': 'User Id',
        'value': true
    }, {
        'short': 'v',
        'long': 'validate',
        'description': 'Use image validation',
        'value': false
    }, {
        'short': 'vr',
        'long': 'verbose',
        'description': 'Verbose output',
        'value': false
    }
];

opts.parse(options, true);

var image = new Image();

image.onerror = function(err) {
    throw err;
};

image.onload = function() {

    if (opts.get('validate')) {
        if (image.width > MAX_IMAGE_WIDTH ||
            image.height > MAX_IMAGE_HEIGHT) {
            log('Image is too big :(');
            process.exit(ERROR_IMAGE_BIG);
        }
        if (image.width < MIN_IMAGE_WIDTH ||
            image.height < MIN_IMAGE_HEIGHT) {
            log('Image is too small :(');
            process.exit(ERROR_IMAGE_SMALL);
        }
    }

    var options = {
        name: opts.get('name'),
        userId: opts.get('userid'),
        invisible: opts.get('private'),
        pieceSize: parseInt(opts.get('piecesize')),
        spriteSize: parseInt(opts.get('spritesize'))
    };

    if (!options.name) {
        options.name = path.basename(image.src, path.extname(image.src));
    }

    db.connect(function() {
        log('Creating puzzle...');
        generate(image, options, function(puzzleId, queueIndex) {
            var result = {
                puzzleId: puzzleId,
                queueIndex: queueIndex
            };

            log('Sprites images are created.');
            log('Queue index: ' + queueIndex);

            if (!opts.get('verbose')) {
                process.stdout.write(JSON.stringify(result));
            }

            process.exit(SUCCESS);
        });
    });
};

image.src = opts.get('image');

function generate(image, options, callback) {
    options.pieceSize || (options.pieceSize = 120);
    options.invisible || (options.invisible = false);
    options.spriteSize || (options.spriteSize = 5);

    var puzzle = random.puzzle(image.width, image.height, options.pieceSize);

    options.hLength = puzzle.hLength;
    options.vLength = puzzle.vLength;

    db.Puzzles.add(puzzle.pieces, options, function(added, queueIndex) {
        var puzzleId = added._id.toHexString();

        log('Puzzle is created. Id: ' + puzzleId + '.');
        log('Creating sprites images...');

        cutter.createPieces({
            image: image,
            hLength: puzzle.hLength,
            vLength: puzzle.vLength,
            piecesMap: puzzle.pieces,
            pieceSize: options.pieceSize,
            spriteSize: options.spriteSize,
            resultDir: PUZZLES_DIR + puzzleId,
            verbose: opts.get('verbose'),
            onFinish: function() {
                callback(puzzleId, queueIndex);
            }
        });
    });
}

function log(message) {
    if (opts.get('verbose')) {
        console.log(message);
    }
}