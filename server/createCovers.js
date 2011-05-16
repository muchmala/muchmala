var path = require('path'),
    opts = require('opts'),
    cutter = require('./cutter'),
    Image = require('canvas').Image;

var COVERS_DIR = __dirname + '/../client/img/covers/';

var options = [{
    'short': 's',
    'long': 'size',
    'description': 'Size',
    'value': true
}];

opts.parse(options, true);

var size = parseInt(opts.get('size')) || 120;

cutter.createCovers(size, COVERS_DIR + size, function() {
    console.log('Covers are created.');
    process.exit();
});
