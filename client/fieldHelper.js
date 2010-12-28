Puzzle.FieldHelper = function(field, pices) {

    function isSameType(first, second) {
        if(first.ears.left == second.ears.left &&
           first.ears.bottom == second.ears.bottom &&
           first.ears.right == second.ears.right &&
           first.ears.top == second.ears.top) {
            return true;
        }
        return false;
    }

    function flipPices(first, second) {
        var tmpX = first.realX;
        var tmpY = first.realY;
        first.realX = second.realX;
        first.realY = second.realY;
        second.realX = tmpX;
        second.realY = tmpY;
        second.draw();
        first.draw();
        first.unselect();
    }

    function flipPicesByCoords(coords) {
        var first = field.getPice(coords[0][0], coords[0][1]);
        var second = field.getPice(coords[1][0], coords[1][1]);
        first.unlock();
        second.unlock();
        flipPices(first, second);
    }

    function buildField(map) {
        for(var y = 0, rLen = map.length; y < rLen; y++) {
            for(var x = 0, cLen = map[y].length; x < cLen; x++) {
                var cell = map[y][x];
                var pice = pices.factory({
                    x: x, y: y,
                    realX: cell.x,
                    realY: cell.y,
                    locked: cell.d,
                    ears: {
                        left: cell.l, bottom: cell.b,
                        right: cell.r, top: cell.t
                    }
                });
                field.addPice(x, y, pice);
            }
        }
        field.build();
        log('field is built');
    }

    function updateField(map) {
        for(var y = 0, rLen = map.length; y < rLen; y++) {
            for(var x = 0, cLen = map[y].length; x < cLen; x++) {
                var cell = map[y][x];
                var pice = field.getPice(x, y);

                if(pice.selected) {
                    pice.unselect();
                }

                if(pice.realX != cell.x || pice.realY != cell.y) {
                    pice.realX = cell.x;
                    pice.realY = cell.y;
                    pice.draw();
                }
            }
        }
        log('field is updated');
    }

    field.flipPices = flipPices;
    field.flipPicesByCoords = flipPicesByCoords;
    field.isSameType = isSameType;
    field.buildField = buildField;
    field.updateField = updateField;

    return field;
};