$(function() {
    var panel = Puzz.Panel,
        server = Puzz.Server,
        viewport = Puzz.Viewport,
        storage = Puzz.Storage;

    var preloader = new Puzz.Preloader();
    var puzzle, selected;
    var m = MESSAGES;

    server.connect();
    panel.loading();

    Puzz.MenuDialog.show();
    Puzz.MenuDialog.openPage('welcome');
    
    server.subscribe('connected', function() {
        var puzzleId = null
        if (window.location.hash.length) {
            puzzleId = window.location.hash.replace('#', '');
        }
        server.initialize(storage.user.id(), puzzleId);
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
        puzzle.subscribe(puzzle.events.leftClicked, processClickedPiece);
        puzzle.subscribe(puzzle.events.rightClicked, releaseSelectedPiece);
        
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
            selectedIndicator.show();
            selected.select();
        });
        server.on(m.releasePiece, function(coords) {
            puzzle.getPiece(coords[0], coords[1]).unselect();
            selectedIndicator.hide();
        });
        server.on(m.swapPieces, function(coord) {
            puzzle.flipPiecesByCoords(coord);
            selectedIndicator.hide();
        });
        server.on(m.puzzleData, function() {
            server.getPiecesData();
        });
        server.on(m.piecesData, function(pieces) {
            puzzle.update(pieces);
        });
    });

    var selectedIndicator = (function() {
        var element = $('#selected');
        element.click(releaseSelectedPiece);
        
        return {
            show: function(type) {
                element.attr('class', '_' + selected.type()).show();
            },
            hide: function() {
                element.hide();
            }};
    })();

    function releaseSelectedPiece() {
        if(selected && selected.selected) {
            server.releasePiece(selected.x, selected.y);
        }
    }

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
