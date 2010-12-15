BorbitPuzzle.pices = function(data) {
    var settings = $.extend({
        piceSize: null,
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
        pice.canvas = canvas;
    }

    function draw(pice) {
        drawer.draw({
            x: pice.tx,
            y: pice.ty,
            ctx: pice.ctx,
            ears: {left: pice.l, bottom: pice.b, right: pice.r, top: pice.t}
        });
    }

    function select(pice) {
        drawer.select({
            ctx: pice.ctx,
            ears: {left: pice.l, bottom: pice.b, right: pice.r, top: pice.t}
        });
    }

    function lock(pice) {
        drawer.lock({
            ctx: pice.ctx,
            ears: {left: pice.l, bottom: pice.b, right: pice.r, top: pice.t}
        });
    }

    function hasPoint(pice, x, y) {
        var s = settings.piceSize / 6;
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
            canvas: null,
            locked: false,
            selected: false,
            xCoord: null,
            yCoord: null,
            tx: null, ty: null,
            x: null, y: null,
            l: null, b: null,
            r: null, t: null
        }, data);

        $.extend(pice, {
            build: function() {
                build(pice);
                pice.ctx = pice.canvas.getContext('2d');
            },

            draw: function() {
                draw(pice);
            },

            select: function() {
                pice.selected = true;
                select(pice);
            },

            unselect: function() {
                pice.selected = false;
                this.draw();
            },

            lock: function() {
                pice.locked = true;
                lock(pice);
            },

            unlock: function() {
                pice.locked = false;
                this.draw();
            },

            hasPoint: function(x, y) {
                return hasPoint(pice, x, y);
            }
        });

        return pice;
    }

    return {
        factory: factory
    };
};