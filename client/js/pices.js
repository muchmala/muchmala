Puzzle.Pice = function(settings) {
    this.x = settings.x;
    this.y = settings.y;
    this.ears = settings.ears;
            
    this.locked = settings.locked;
    this.realX = settings.realX;
    this.realY = settings.realY;
    this.size = settings.size;
    this.imageSrc = settings.imageSrc;

    var rectSize = Math.floor(this.size / 3 * 2);
    this.xCoord = this.x * (rectSize + 1);
    this.yCoord = this.y * (rectSize + 1);

    this.element = null;
};

Puzzle.Pice.prototype.build = function() {
    this.element = $(document.createElement('div'));
    this.element.height(this.size);
    this.element.width(this.size);
    this.element.css('position', 'absolute');
    this.element.css('left', this.xCoord);
    this.element.css('top', this.yCoord);
    this.element.css('background', 'url('+this.imageSrc+')');
    this.element.css('background-position', '-' + (this.realX * this.size) + 'px ' +
                                            '-' + (this.realY * this.size) + 'px');

    return this.element;
};

Puzzle.Pice.prototype.select = function() {};
Puzzle.Pice.prototype.unselect = function() {};
Puzzle.Pice.prototype.lock = function() {};
Puzzle.Pice.prototype.unlock = function() {};
Puzzle.Pice.prototype.cover = function() {};
Puzzle.Pice.prototype.uncover = function() {};

Puzzle.Pice.prototype.hasPoint = function(x, y) {
    var s = this.size / 6;
    var xc = this.xCoord;
    var yc = this.yCoord;

    if((x >= xc+s && y >= yc+s && x <= xc+s*2.5 && y <= yc+s*2.5) ||
       (x >= xc+s*3.5 && y >= yc+s && x <= xc+s*5 && y <= yc+s*2.5) ||
       (x >= xc+s && y >= yc+s*3.5 && x <= xc+s*2.5 && y <= yc+s*5) ||
       (x >= xc+s*3.5 && y >= yc+s*3.5 && x <= xc+s*5 && y <= yc+s*5) ||
       (x >= xc+s*2 && y >= yc+s*2 && x <= xc+s*4 && y <= yc+s*4) ||
       (this.ears.left && x >= xc && y >= yc+s*2.5 && x <= xc+s*2 && y <= yc+s*3.5) ||
       (this.ears.bottom && x >= xc+s*2.5 && y >= yc+s*4 && x <= xc+s*3.5 && y <= yc+s*6) ||
       (this.ears.right && x >= xc+s*4 && y >= yc+s*2.5 && x <= xc+s*6 && y <= yc+s*3.5) ||
       (this.ears.top && x >= xc+s*2.5 && y >= yc && x <= xc+s*3.5 && y <= yc+s*2)) {
        return true;
    }
    return false;
};

Puzzle.Pice.prototype.onRightPlace = function() {
    return this.realX == this.x && this.realY == this.y;
};