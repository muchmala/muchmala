var Canvas = require('canvas'),
    cutter = require('./cutter'),
    random = require('./random'),
    opts = require('opts'),
    db = require('./db'),
    Image = Canvas.Image;

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
        'value': true,
        'required': true
    }, {
        'short': 's',
        'long': 'piecesize',
        'description': 'Piece size',
        'value': true,
        'required': true
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
        pieceSize: parseInt(opts.get('piecesize'))
    };

    var puzzle = random.puzzle(image.width, image.height, settings.pieceSize);

    settings.hLength = puzzle.hLength;
    settings.vLength = puzzle.vLength;

    function onCut() {
        console.log('Picture is cut...');

        db.connect(function() {
            db.Puzzles.add(puzzle.pieces, settings, function(map) {
                console.log('Map is added. Id: ' + map._id.toHexString());
                process.exit();
            });
        });
    }
    
    cutter.cut({
        image: image,
        hLength: puzzle.hLength,
        vLength: puzzle.vLength,
        piecesMap: puzzle.pieces,
        pieceSize: settings.pieceSize,
        resultDir: __dirname + '/../client/img/' + settings.name,
        onFinish: onCut
    });
};

image.src = __dirname + '/../client/' + opts.get('image');
