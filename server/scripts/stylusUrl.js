var stylus = require('stylus');

module.exports = function() {
    return function(style) {
        style.define('url', stylus.url({
            paths: [__dirname + '/../../client']
        }));
    };
};