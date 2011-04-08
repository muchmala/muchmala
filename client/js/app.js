$(function() {
    var panel = Puzz.Panel,
        server = Puzz.Server,
        viewport = Puzz.Viewport,
        storage = Puzz.Storage;

    var preloader = new Puzz.Preloader();
    var puzzle, selected, userName;
    var m = MESSAGES;

    server.connect();
    panel.loading();

    Puzz.MenuDialog.show();
    Puzz.MenuDialog.openPage('welcome');
    
    server.subscribe('connected', function() {
        var puzzleId = null;
        if (window.location.hash.length) {
            puzzleId = window.location.hash.replace('#', '');
        }
        server.initialize(storage.user.id(), puzzleId);
    });

    server.subscribe(m.puzzleData, function(data) {
        if (data.completion == 100) {
            if (!Puzz.CompleteDialog.shown) {
                Puzz.MenuDialog.hide();
                Puzz.MenuDialog.on('hidden', function() {
                    Puzz.CompleteDialog.show(data);
                });
            }
        }
    });

    server.subscribe(m.userData, function(data) {
        userName = data.name;
    });

    server.once(m.puzzleData, function(data) {
        var images = {
            spriteSrc: '/img/puzzles/' + data.id + '/pieces.png',
            defaultCoverSrc: '/img/puzzles/' + data.id + '/default_covers.png',
            selectCoverSrc: '/img/puzzles/' + data.id + '/select_covers.png',
            lockCoverSrc: '/img/puzzles/' + data.id + '/lock_covers.png'
        };
        
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

        server.on(m.lockPiece, function(locked) {
            var piece = puzzle.getPiece(locked.coords[0], locked.coords[1]);
            if (locked.userName == userName) {
                selected = piece;
                selected.select();
                selectedIndicator.show();
            } else {
                piece.lock(locked.userName);
            }
        });
        server.on(m.unlockPiece, function(unlocked) {
            var piece = puzzle.getPiece(unlocked.coords[0], unlocked.coords[1]);
            if (unlocked.userName == userName) {
                piece.unselect();
                selectedIndicator.hide();
            } else {
                piece.unlock();
            }
        });
        server.on(m.swapPieces, function(coord) {
            puzzle.flipPiecesByCoords(coord);
            selectedIndicator.hide();
        });
        server.on(m.initialized, function() {
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
            show: function() {
                element.attr('class', '_' + selected.type()).show();
            },
            hide: function() {
                element.hide();
            }
        };
    })();

    function releaseSelectedPiece() {
        if(selected && selected.selected) {
            server.unlockPiece(selected.x, selected.y);
        }
    }

    function processClickedPiece(piece) {
        if(!piece.locked && !piece.isCollected()) {
            if(piece.selected) {
                server.unlockPiece(piece.x, piece.y);
            } else if(!selected || !selected.selected) {
                server.lockPiece(piece.x, piece.y);
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
