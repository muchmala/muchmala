Puzzle.Pice = function(settings) {
    this.x = settings.x;
    this.y = settings.y;
    this.ears = settings.ears;
    this.images = Puzzle.Pice.IMAGES;
            
    this.realX = settings.realX;
    this.realY = settings.realY;
    this.size = settings.size;

    var rectSize = Math.floor(this.size / 3 * 2);
    this.xCoord = this.x * (rectSize + 1);
    this.yCoord = this.y * (rectSize + 1);

    this.locked = settings.locked;
    this.selected = false;
    
    this.element = $(document.createElement('div'));
    this.render();
};

Puzzle.Pice.setImages = function(images) {
    Puzzle.Pice.IMAGES = _.extend({
        spriteSrc: null,
        defaultCoverSrc: null,
        selectCoverSrc: null,
        lockCoverSrc: null
    }, images);
};

Puzzle.Pice.prototype.render = function() {
    this.element.css({
        'top': this.yCoord,
        'left': this.xCoord,
        'width': this.size,
        'height': this.size,
        'background-image': 'url(' + this.images.spriteSrc + ')',
        'background-position': '-' + (this.realX * this.size) + 'px ' +
                               '-' + (this.realY * this.size) + 'px'
    });

    this.clear();
    
    if(this.locked) {
        this.cover(this.images.lockCoverSrc);
    } else if(this.selected) {
        this.cover(this.images.selectCoverSrc);
    } else if(!this.isCollected()) {
        this.cover(this.images.defaultCoverSrc);
    }

    return this.element;
};

Puzzle.Pice.prototype.cover = function(coverSrc) {
    var cover = $(document.createElement('div'));
    
    var type = 'type_';
    type += this.ears.left ? '1' : '0';
    type += this.ears.top ? '1' : '0';
    type += this.ears.right ? '1' : '0';
    type += this.ears.bottom ? '1' : '0';

    cover.css('background', 'url(' + coverSrc + ')');
    cover.addClass('cover');
    cover.addClass(type);

    this.element.append(cover);
};

Puzzle.Pice.prototype.select = function() {
    this.selected = true;
    this.render();
};
Puzzle.Pice.prototype.lock = function() {
    this.locked = true;
    this.render();
};
Puzzle.Pice.prototype.unselect = function() {
    this.selected = false;
    this.render();
};
Puzzle.Pice.prototype.unlock = function() {
    this.locked = false;
    this.render();
};
Puzzle.Pice.prototype.clear = function() {
    this.element.find('.cover').remove();
};

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

Puzzle.Pice.prototype.isCollected = function() {
    return this.realX == this.x && this.realY == this.y;
};