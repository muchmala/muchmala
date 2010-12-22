var db = require('./db');
var oldMaps = require('./maps')

var Maps = {
    list: function(limit, callback) {},

    generate: function(width, height, piceSize, callback) {
        var map = Map(oldMaps.generate(width, height, piceSize));
        map.save(function() {
            callback.call(this, map);
        });
    },

    get: function(id, callback) {
        //
    }
};

var Map = function(data) {

    return {
        data: data,

        save: function(callback) {
            callback.call(this);
        },

        lock: function(x, y, callback) {

        },

        unlock: function(x, y, callback) {

        },

        flip: function(x1, y1, x2, y2) {
            
        }
    }

};

exports.Maps = Maps;
exports.Map = Map;