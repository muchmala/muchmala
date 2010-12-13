function toInt(value) {
    return parseInt(value, 10);
}

function rand(max) {
    return Math.floor(Math.random() * (max + 1));
}

function generatePuzzleMap(width, height, piceSize) {
    var rectSize = toInt(piceSize/3 * 2);
    var countH = toInt((width - rectSize/2) / rectSize);
    var countV = toInt((height - rectSize/2) / rectSize);

    var result = [];
    var sorted = {};
    var index = [];

    for(var y = 0; y < countV; y++) {
        for(var x = 0; x < countH; x++) {
            var top = rand(1);
            var left = rand(1);

            if(result[y-1] != null && result[y-1][x] != null) {
                if(result[y-1][x].b == 1) {
                    top = 0;
                } else {
                    top = 1;
                }
            }

            if(result[y] != null && result[y][x-1] != null) {
                if(result[y][x-1].r == 1) {
                    left = 0;
                } else {
                    left = 1;
                }
            }

            if(result[y] == null) {
                result[y] = [];
            }

            result[y][x] = {
                t: top,
                l: left,
                b: rand(1),
                r: rand(1),
                x: x,
                y: y
            };

            var key = ''+result[y][x].l + result[y][x].b +
                         result[y][x].r + result[y][x].t;

            if (sorted[key] == null) {
                sorted[key] = [];
            }

            sorted[key].push(result[y][x]);
            index.push(key);
        }

    }

    for (var i in sorted) {
        sorted[i].sort(function() {
            return 0.5 - Math.random();
        });
    }

    var shuffled = [];
    var k;

    for(y = 0, k = 0; y < countV; y++) {
        shuffled[y] = [];

        for(x = 0; x < countH; x++, k++) {
            shuffled[y][x] = sorted[index[k]].pop();
        }
    }

    return shuffled;
}