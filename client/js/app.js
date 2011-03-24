$(function() {
    var menu = Puzzle.MenuDialog,
        panel = Puzzle.Panel,
        server = Puzzle.Server,
        viewport = Puzzle.Viewport;

    var preloader = new Puzzle.Preloader(),
        puzzle, selected,
        m = MESSAGES;

    server.connect();
    viewport.showLoading();

    server.subscribe('connected', function() {
        server.initialize(1, Puzzle.Storage.getUserId());
    });

    server.subscribe(m.userData, function(data) {
        Puzzle.Storage.setUserId(data.id);
        panel.setScore(data.puzzleScore);
        panel.setUsername(data.name);
        panel.show();
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
    
    server.subscribe(m.topTwenty, function(data) {
        menu.updateTopTwenty(data);
    });

    server.subscribe(m.puzzleData, function(data) {
        var images = {
            spriteSrc: '/img/' + data.name + '/pieces.png',
            defaultCoverSrc: '/img/' + data.name + '/default_covers.png',
            selectCoverSrc: '/img/' + data.name + '/select_covers.png',
            lockCoverSrc: '/img/' + data.name + '/lock_covers.png'
        };

        viewport.arrange(data.pieceSize, data.vLength, data.hLength);
        panel.setTimeSpent(data.created);
        panel.setCompleteLevel(data.completion);
        panel.setConnectedUsersCount(data.connected);
        panel.setPiecesNumber(data.vLength * data.hLength);
        panel.on(panel.events.userNameChanged, server.setUserName);

        preloader.loadImages(images, function() {
            puzzle = Puzzle.Puzzle({
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
        viewport.hideLoading();
        puzzle.build(pieces);
        puzzle.subscribe('clicked', processClickedPice);

        server.subscribe(m.lockPiece, function(coords) {
            puzzle.getPice(coords[0], coords[1]).lock();
        });

        server.subscribe(m.unlockPieces, function(coords) {
            _.each(coords, function(pice) {
                puzzle.getPice(pice[0], pice[1]).unlock();
            });
        });

        server.subscribe(m.selectPiece, function(coords) {
            selected = puzzle.getPice(coords[0], coords[1]);
            selected.select();
        });

        server.subscribe(m.releasePiece, function(coords) {
            puzzle.getPice(coords[0], coords[1]).unselect();
        });

        server.subscribe(m.swapPieces, function(coord) {
            puzzle.flipPicesByCoords(coord);
        });
    });

    function processClickedPice(piece) {
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
