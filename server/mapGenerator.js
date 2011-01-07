var opts = require('opts');
var config = require('./config');
var db = require('./db');
var models = require('./models');

(function main() {
    var options = getOptions();
    var imageSize = getImageSize(options.image);

    db.createConnection(function() {
        db.useCollection('maps', function(error, mapsCollection) {
            db.useCollection('pieces', function(error, piecesCollection) {

                var mapsLoader = models.maps.load(mapsCollection, piecesCollection);

                mapsLoader.addMap(
                    imageSize.width,
                    imageSize.height,
                    options.pieceSize,
                    options.image,
                    options.name, function(map) {
                        console.log('Done. Id is ' + map._id.toHexString());
                        process.exit();
                    });

            });
        });

    });
})();

function getImageSize(imageSrc) {
    return {
        width: opts.get('width'),
        height: opts.get('height')
    };
}

function getOptions() {
    opts.parse([
        {
            "short": 'i',
            "long": 'image',
            "description": 'Image from what the puzzle will be created',
            "value": true,
            "required": true
        }, {
            "short": 'n',
            "long": 'name',
            "description": 'Puzzle name',
            "value": true,
            "required": true
        }, {
            "short": 's',
            "long": 'piecesize',
            "description": 'Size of single piece',
            "value": true
        },

        {
            "short": 'W',
            "long": 'width',
            "description": 'Image width',
            "value": true,
            "required": true
        }, {
            "short": 'H',
            "long": 'height',
            "description": 'Image height',
            "value": true,
            "required": true
        }
    ], true);

    return {
        image: opts.get('image'),
        name: opts.get('name'),
        pieceSize: opts.get('piecesize') || 90
    };
}
