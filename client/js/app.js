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

    if (!storage.menu.isShown()) {
        Puzz.MenuDialog.show();
    }
    
    server.subscribe('connected', function() {
        server.initialize(1, storage.getUserId());
    });
    server.subscribe(m.connectedUsersCount, function(count) {
        panel.setConnectedUsersCount(count);
    });
    server.subscribe(m.completionPercentage, function(percent) {
        panel.setCompleteLevel(percent);
    });
    server.subscribe(m.leadersBoard, function(data) {
        panel.updateLeadersBoard(data);
    });
    server.subscribe(m.userData, function(data) {
        storage.setUserId(data.id);
        panel.setUserData(data);
        panel.userDataLoaded();
    });

    server.subscribe(m.puzzleData, function(data) {
        var images = {
            spriteSrc: '/img/' + data.name + '/pieces.png',
            defaultCoverSrc: '/img/' + data.name + '/default_covers.png',
            selectCoverSrc: '/img/' + data.name + '/select_covers.png',
            lockCoverSrc: '/img/' + data.name + '/lock_covers.png'
        };

        panel.setPuzzleData(data);
        panel.on('userNameChanged', server.setUserName);
        viewport.arrange(data.pieceSize, data.vLength, data.hLength);

        preloader.loadImages(images, function() {
            puzzle = Puzz.Puzzle({
                piceSize: data.pieceSize,
                viewport: viewport.content,
                sprite: preloader.cache[images.spriteSrc],
                lockCover: preloader.cache[images.lockCoverSrc],
                selectCover: preloader.cache[images.selectCoverSrc],
                defaultCover: preloader.cache[images.defaultCoverSrc]
            });

            server.getPiecesData();
        });
    });

    server.subscribe(m.piecesData, function(pieces) {
        panel.puzzleLoaded();
        puzzle.build(pieces);
        puzzle.subscribe('clicked', processClickedPiece);
        $(document.body).removeClass('fallback');

        server.subscribe(m.lockPiece, function(coords) {
            puzzle.getPiece(coords[0], coords[1]).lock();
        });

        server.subscribe(m.unlockPieces, function(coords) {
            _.each(coords, function(pice) {
                puzzle.getPiece(pice[0], pice[1]).unlock();
            });
        });

        server.subscribe(m.selectPiece, function(coords) {
            selected = puzzle.getPiece(coords[0], coords[1]);
            selected.select();
        });

        server.subscribe(m.releasePiece, function(coords) {
            puzzle.getPiece(coords[0], coords[1]).unselect();
        });

        server.subscribe(m.swapPieces, function(coord) {
            puzzle.flipPiecesByCoords(coord);
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
