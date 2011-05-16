var path = require('path'),
    opts = require('opts'),
    cutter = require('./cutter'),
    random = require('./random'),
    db = require('./db'),
    Image = require('canvas').Image;

var PUZZLES_DIR = __dirname + '/../client/img/puzzles/';

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
        'short': 'v',
        'long': 'invisible',
        'description': 'Is puzzle invisible',
        'value': false
    }
];

opts.parse(options, true);

var image = new Image();

image.onerror = function(err) {
    throw err;
};

image.onload = function() {
    var settings = {
        name: opts.get('name'),
        invisible: opts.get('invisible') || false,
        pieceSize: parseInt(opts.get('piecesize')) || 120,
        spriteSize: parseInt(opts.get('spritesize')) || 5
    };

    if (!settings.name) {
        settings.name = path.basename(image.src, path.extname(image.src));
    }

    var puzzle = random.puzzle(image.width, image.height, settings.pieceSize);

    settings.hLength = puzzle.hLength;
    settings.vLength = puzzle.vLength;

    db.connect(function() {
        console.log('Creating puzzle...');
        db.Puzzles.add(puzzle.pieces, settings, function(added) {
            var puzzleId = added._id.toHexString();

            console.log('Puzzle is created. Id: ' + puzzleId + '.');
            console.log('Creating sprites images...');

            cutter.createPieces({
                image: image,
                hLength: puzzle.hLength,
                vLength: puzzle.vLength,
                piecesMap: puzzle.pieces,
                pieceSize: settings.pieceSize,
                spriteSize: settings.spriteSize,
                resultDir: PUZZLES_DIR + puzzleId,
                onFinish: function() {
                    console.log('Sprites images are created.');
                    process.exit();
                }
            });
        });
    });
};

image.src = opts.get('image');
