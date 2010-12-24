var db = require('./db');
var oldMaps = require('./maps')

var MapsLoader = function(collection) {
    var maps = [];

    var Map = function(id, callback) {
        var mapCompactFormat = oldMaps.generate(1420, 950, 90);

        var mapInfo = {
            imageSrc: 'images/springfield.jpg',
            piceSize: 90,
            pieces: []
        };

        (function() {
            for (var y in mapCompactFormat) {
                for (var x in mapCompactFormat[y]) {
                    mapInfo.pieces.push({
                        realX: x,
                        realY: y,
                        x: mapCompactFormat[y][x].x,
                        y: mapCompactFormat[y][x].y,
                        top: mapCompactFormat[y][x].t,
                        bottom: mapCompactFormat[y][x].b,
                        left: mapCompactFormat[y][x].l,
                        right: mapCompactFormat[y][x].r,
                        locked: ''
                    });
                }
            }

        })();

        function findElement(x, y) {
            for (var i in mapInfo.pieces) {
                if (mapInfo.pieces[i].x == x && mapInfo.pieces[i].y == y) {
                    return i;
                }
            }
        }

        callback.call(this, {
            lock: function(x, y, userId, callback) {
                var i = findElement(x, y);
                if (mapInfo.pieces[i].locked &&
                    mapInfo.pieces[i].locked != userId) {

                    callback.call(this, false);
                    return;
                }

                mapInfo.pieces[i].locked = userId;
                callback.call(this, true);
            },

            unlock: function(x, y, userId, callback) {
                var i = findElement(x, y);
                if (mapInfo.pieces[i].locked == userId) {
                    mapInfo.pieces[i].locked = '';

                    callback.call(this, true);
                    return;
                }

                callback.call(this, false);
            },

            unlockAll: function(userId, callback) {
                var lockedItems = [];

                for (var i in mapInfo.pieces) {
                    if (mapInfo.pieces[i].locked == userId) {
                        mapInfo.pieces[i].locked = '';

                        lockedItems.push([mapInfo.pieces[i].x, mapInfo.pieces[i].y]);
                    }
                }

                callback.call(this, lockedItems);
            },

            flip: function(x1, y1, x2, y2, userId, callback) {
                var i = findElement(x1, y1);
                var j = findElement(x2, y2);

                if (mapInfo.pieces[i].locked == userId &&
                    mapInfo.pieces[j].locked == '') {

                    mapInfo.pieces[i].locked = '';

                    var c = mapInfo.pieces[j].x;
                    mapInfo.pieces[j].x = mapInfo.pieces[i].x;
                    mapInfo.pieces[i].x = c;

                    c = mapInfo.pieces[j].y;
                    mapInfo.pieces[j].y = mapInfo.pieces[i].y;
                    mapInfo.pieces[i].y = c;

                    callback.call(this, true);
                    return;
                }

                callback.call(this, false);
            },

            getCompactInfo: function(callback) {
                var compactData = {
                    imageSrc: mapInfo.imageSrc,
                    piceSize: mapInfo.piceSize,
                    map: []
                };

                var pieces = mapInfo.pieces.concat();

                for (var i in pieces) {
                    if (compactData.map[pieces[i].y] === undefined) {
                        compactData.map[pieces[i].y] = [];
                    }

                    compactData.map[pieces[i].y][pieces[i].x] = {
                        t: pieces[i].top,
                        l: pieces[i].left,
                        b: pieces[i].bottom,
                        r: pieces[i].right,
                        x: pieces[i].realX,
                        y: pieces[i].realY,
                        d: !!pieces[i].locked
                    };
                }

                callback.call(this, compactData);
            }
        });

    };

    return {
        listMaps: function(limit, callback) {},

        generateMap: function(width, height, piceSize, callback) {},

        getMap: function(id, callback) {
            Map(id, callback);
        }
    };
};

exports.MapsLoader = MapsLoader;
