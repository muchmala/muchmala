var Canvas = require('canvas'),
    cutter = require('./cutter'),
    random = require('./random'),
    models = require('./models'),
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
    var map = random.map(image.width, image.height, pieceSize);

    function onCut() {
        console.log('Picture is cut...');

        db.createConnection(function() {
            db.useCollection('puzzles', function(error, puzzlesCollection) {
                db.useCollection('pieces', function(error, piecesCollection) {
                    var puzzles = models.maps.load(puzzlesCollection, piecesCollection);

                    puzzles.addMap(map.pieces, pieceSize, mapName, function(map) {
                        console.log('Map is added. Id: ' + map._id.toHexString());
                        process.exit();
                    });
                });
            });
        });
    }
    
    cutter.cut({
        image: image,
        hLength: map.hLength,
        vLength: map.vLength,
        piecesMap: map.pieces,
        pieceSize: pieceSize,
        resultDir: __dirname + '/../client/img/' + mapName,
        onFinish: onCut
    });
};

image.src = __dirname + '/../client/' + opts.get('image');
