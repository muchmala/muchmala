BorbitPuzzle.pices = function(data) {
    var settings = $.extend({
        piceSize: null,
        rectSize: null,
        image: null
    }, data);

    var drawer = BorbitPuzzle.piceDrawer({
        image: settings.image,
        piceSize: settings.piceSize
    });

    function build(pice) {
        var canvas = document.createElement('canvas');
        canvas.height = settings.piceSize;
        canvas.width = settings.piceSize;
        canvas.style.position = 'absolute';
        canvas.style.top = pice.yCoord + 'px';
        canvas.style.left = pice.xCoord + 'px';
        return canvas;
    }

    function draw(pice) {
        drawer.draw({
            ctx: pice.ctx,
            imageX: pice.ix,
            imageY: pice.iy,
            ears: {
                left: pice.l, bottom: pice.b,
                right: pice.r, top: pice.t
            }
        });
    }

    function select(pice) {
        drawer.highlight({
            ctx: pice.ctx,
            ears: {
                left: pice.l, bottom: pice.b,
                right: pice.r, top: pice.t
            }
        });
    }

    function hasPoint(pice, x, y) {
        var s = settings.rectSize / 4;
        var xc = pice.xCoord;
        var yc = pice.yCoord;

        if((x >= xc+s && y >= yc+s && x <= xc+s*2.5 && y <= yc+s*2.5) ||
           (x >= xc+s*3.5 && y >= yc+s && x <= xc+s*5 && y <= yc+s*2.5) ||
           (x >= xc+s && y >= yc+s*3.5 && x <= xc+s*2.5 && y <= yc+s*5) ||
           (x >= xc+s*3.5 && y >= yc+s*3.5 && x <= xc+s*5 && y <= yc+s*5) ||
           (x >= xc+s*2 && y >= yc+s*2 && x <= xc+s*4 && y <= yc+s*4) ||
           (pice.l && x >= xc && y >= yc+s*2.5 && x <= xc+s*2 && y <= yc+s*3.5) ||
           (pice.b && x >= xc+s*2.5 && y >= yc+s*4 && x <= xc+s*3.5 && y <= yc+s*6) ||
           (pice.r && x >= xc+s*4 && y >= yc+s*2.5 && x <= xc+s*6 && y <= yc+s*3.5) ||
           (pice.t && x >= xc+s*2.5 && y >= yc && x <= xc+s*3.5 && y <= yc+s*2)) {
            return true;
        }
        return false;
    }

    function factory(data) {
        var pice = $.extend({
            ctx: null,
            yCoord: null,
            selected: false,
            ix: null, iy: null,
            tx: null, ty: null,
            x: null, y: null, l: null,
            b: null, r: null, t: null
        }, data);

        pice.xCoord = pice.x ? pice.x * (settings.rectSize + 1) : 0;
        pice.yCoord = pice.y ? pice.y * (settings.rectSize + 1) : 0;

        return {
            x: pice.x,
            y: pice.y,

            build: function() {
                var canvas = build(pice);
                pice.ctx = canvas.getContext('2d');
                return canvas;
            },

            draw: function() {
                draw(pice);
            },

            select: function() {
                select(pice);
            },

            hasPoint: function(x, y) {
                return hasPoint(pice, x, y);
            }
        };
    }

    return {
        factory: factory
    };
};