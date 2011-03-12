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
    this.highlighted = false;
    
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.element = this.canvas;

    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.canvas.style.top = this.yCoord + 'px';
    this.canvas.style.left = this.xCoord + 'px';
    
    this.render();
};

Puzzle.Pice.setImages = function(images) {
    Puzzle.Pice.IMAGES = _.extend({
        sprite: null,
        defaultCover: null,
        selectCover: null,
        lockCover: null
    }, images);
};

Puzzle.Pice.coverOffsets = {
    '0000': [0, 0], '1111': [1, 0],
    '1000': [2, 0], '0100': [3, 0],
    '0010': [0, 1], '0001': [1, 1],
    '1110': [2, 1], '0111': [3, 1],
    '1101': [0, 2], '1011': [1, 2],
    '1100': [2, 2], '0011': [3, 2],
    '0110': [0, 3], '1001': [1, 3],
    '0101': [2, 3], '1010': [3, 3]
};

Puzzle.Pice.prototype.render = function() {
    this.ctx.clearRect(0, 0, this.size, this.size);
    this.ctx.drawImage(this.images.sprite,  this.realX * this.size,
                       this.realY * this.size, this.size, this.size,
                       0, 0, this.size, this.size);
    
    if(this.locked) {
        this.cover(this.images.lockCover);
    } else if(this.selected) {
        this.cover(this.images.selectCover)
    } else if(!this.highlighted && !this.isCollected()) {
        this.cover(this.images.defaultCover);
    }

    return this.canvas;
};

Puzzle.Pice.prototype.cover = function(coverImage) {
    var type = '';
    type += this.ears.left ? '1' : '0';
    type += this.ears.top ? '1' : '0';
    type += this.ears.right ? '1' : '0';
    type += this.ears.bottom ? '1' : '0';

    this.ctx.drawImage(coverImage, Puzzle.Pice.coverOffsets[type][0] * this.size,
                       Puzzle.Pice.coverOffsets[type][1] * this.size, this.size,
                       this.size, 0, 0, this.size, this.size);
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
Puzzle.Pice.prototype.highlight = function() {
    this.highlighted = true;
    this.render();
};
Puzzle.Pice.prototype.unhighlight = function() {
    this.highlighted = false;
    this.render();
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