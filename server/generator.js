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
    }
];

opts.parse(options, true);

var image = new Image();

image.onerror = function(err) {
    throw err;
};

image.onload = function() {
    var mapName = opts.get('name');
    var pieceSize = parseInt(opts.get('piecesize'));
    var puzzle = random.puzzle(image.width, image.height, pieceSize);

    function onCut() {
        console.log('Picture is cut...');

        db.connect(function() {
            db.Puzzles.add(puzzle.pieces, puzzle.hLength,
                           puzzle.vLength, pieceSize, mapName, 
                           function(map) {
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
        pieceSize: pieceSize,
        resultDir: __dirname + '/../client/img/' + mapName,
        onFinish: onCut
    });
};

image.src = __dirname + '/../client/' + opts.get('image');
