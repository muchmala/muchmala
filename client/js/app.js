$(function() {
    var panel = Puzz.Panel,
        server = Puzz.Server,
        viewport = Puzz.Viewport,
        storage = Puzz.Storage;

    var preloader = new Puzz.Preloader();
    var puzzle, selected, built = false;
    var m = MESSAGES;

    server.connect();
    panel.loading();

    if (!storage.menu.isShown()) {
        Puzz.MenuDialog.show();
    }
    
    server.subscribe('connected', function() {
        server.initialize(1, storage.user.id());
    });

    server.once(m.puzzleData, function(data) {
        var images = {
            spriteSrc: '/img/' + data.name + '/pieces.png',
            defaultCoverSrc: '/img/' + data.name + '/default_covers.png',
            selectCoverSrc: '/img/' + data.name + '/select_covers.png',
            lockCoverSrc: '/img/' + data.name + '/lock_covers.png'
        };

        panel.on('userNameChanged', server.setUserName);
        viewport.arrange(data.pieceSize, data.vLength, data.hLength);

        preloader.loadImages(images, function() {
            puzzle = Puzz.Puzzle({
                pieceSize: data.pieceSize,
                viewport: viewport.content,
                sprite: preloader.cache[images.spriteSrc],
                lockCover: preloader.cache[images.lockCoverSrc],
                selectCover: preloader.cache[images.selectCoverSrc],
                defaultCover: preloader.cache[images.defaultCoverSrc]
            });

            server.getPiecesData();
        });
    });

    server.once(m.piecesData, function(pieces) {
        puzzle.build(pieces);
        puzzle.subscribe('clicked', processClickedPiece);
        
        $(document.body).removeClass('fallback');

        server.on(m.lockPiece, function(coords) {
            puzzle.getPiece(coords[0], coords[1]).lock();
        });
        server.on(m.unlockPieces, function(coords) {
            _.each(coords, function(piece) {
                puzzle.getPiece(piece[0], piece[1]).unlock();
            });
        });
        server.on(m.selectPiece, function(coords) {
            selected = puzzle.getPiece(coords[0], coords[1]);
            selected.select();
        });
        server.on(m.releasePiece, function(coords) {
            puzzle.getPiece(coords[0], coords[1]).unselect();
        });
        server.on(m.swapPieces, function(coord) {
            puzzle.flipPiecesByCoords(coord);
        });
        server.on(m.puzzleData, function() {
            server.getPiecesData();
        });
        server.on(m.piecesData, function(pieces) {
            puzzle.update(pieces);
        });
    });

    function processClickedPiece(piece) {
        if(!piece.locked && !piece.isCollected()) {
            if(piece.selected) {
                server.releasePiece(piece.x, piece.y);
            } else if(!selected || !selected.selected) {
                server.selectPiece(piece.x, piece.y);
            } else {
                if(puzzle.isSameType(selected, piece)) {
                    selected.unselect();
                    server.swapPieces(selected.x, selected.y, piece.x, piece.y);
                }
            }
        }
    }
});

function log(message) {
    if(window.console != null &&
        window.console.log != null) {
        console.log(message);
    }
}
