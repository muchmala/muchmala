var db = require('./db');
var oldMaps = require('./maps')

var Maps = {
    create: oldMaps.generate,
    load: function() {
        //
    }
};

var Map = (function() {
    return function() {

    };
})();

exports.Maps = Maps;
exports.Map = Map;