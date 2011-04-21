$(function() {
    var Puzz = window.Puzz;
    
    if ($.browser.msie && $.browser.version < 9.0) {
        $('#browser').show();
        return;
    }

    var server = new Puzz.Server();
    var menu = new Puzz.MenuDialog(server);
    var panel = new Puzz.Panel(server, menu);
    var complete = new Puzz.CompleteDialog(server);
    var viewport = new Puzz.Viewport();

    var puzzle, puzzleId, selected, userName;
    
    server.on('connected', function() {
        if (window.location.hash.length) {
            puzzleId = window.location.hash.replace('#', '');
        }
        server.initialize(Puzz.Storage.user.id(), puzzleId);
    });

    server.on(MESSAGES.userData, function(data) {
        userName = data.name;
    });

    server.on(MESSAGES.puzzleData, function(data) {
        if (data.completion != 100 ||
			complete.shown || complete.closed) {
		    return;
		}
        
        menu.hide().on('hidden', function() {
            complete.show(data);
        });
    });

    server.once(MESSAGES.puzzleData, function(data) {
        viewport.pieceSize = data.pieceSize;
        viewport.arrange(data.vLength, data.hLength);
		
		puzzleId = data.id;
        puzzle = Puzz.Puzzle({
            pieceSize: data.pieceSize,
            viewport: viewport.content
        });

        var load = new Puzz.Loader();
        
        server.once(MESSAGES.piecesData, function(pieces) {
            flow.exec(function() {
                load.covers(puzzleId, this);
            }, function(covers) {

                Puzz.Piece.setImages({
                    lockCover: covers.lock,
                    selectCover: covers.select,
                    defaultCover: covers['default']
                });

                Puzz.Piece.setSpriteSize(data.spriteSize);

                var rows = Math.ceil(data.vLength / data.spriteSize);
                var cols = Math.ceil(data.hLength / data.spriteSize);

                var percentLoaded = (3 + rows * cols) / 100;
                var objectsLoaded = 3;

                menu.loaded(Math.floor(objectsLoaded / percentLoaded));

                load.sprites(puzzleId, rows, cols, function(row, col, sprite) {
                    Puzz.Piece.setSprite(row, col, sprite);

                    menu.loaded(Math.floor(++objectsLoaded / percentLoaded));

                    var piecesToShow = _.select(pieces, function(piece) {
                        return piece.realX >= col * data.spriteSize &&
                               piece.realY >= row * data.spriteSize &&
                               piece.realX <= (col * data.spriteSize) + data.spriteSize - 1 &&
                               piece.realY <= (row * data.spriteSize) + data.spriteSize - 1;
                    });

                    _.each(piecesToShow, function(pieceData) {
                        puzzle.addPiece(pieceData);
                    });
                }, this);

            }, function() {
                enablePuzzle();
                server.getPiecesData();
                menu.loadingComplete();
				panel.loadingComplete();
                puzzle.buildIndex();
            });
        });

        server.getPiecesData();
    });

    function enablePuzzle() {
        puzzle.subscribe(puzzle.events.leftClicked, processClickedPiece);
        puzzle.subscribe(puzzle.events.rightClicked, releaseSelectedPiece);

        $(document.body).removeClass('fallback')

        server.on(MESSAGES.lockPiece, function(locked) {
            var piece = puzzle.getPiece(locked.coords[0], locked.coords[1]);
            if (locked.userName == userName) {
                selected = piece;
                selected.select();
                selectedIndicator.show();
            } else {
                piece.lock();
                viewport.addTooltip(piece.yCoord, piece.xCoord, locked.userName);
            }
        });
        server.on(MESSAGES.unlockPiece, function(unlocked) {
            var piece = puzzle.getPiece(unlocked.coords[0], unlocked.coords[1]);
            if (unlocked.userName == userName) {
                piece.unselect();
                selectedIndicator.hide();
            } else {
                viewport.removeTooltip(piece.yCoord, piece.xCoord)
                piece.unlock();
            }
        });
        server.on(MESSAGES.swapPieces, function(coord) {
            puzzle.flipPiecesByCoords(coord);
        });
        server.on(MESSAGES.initialized, function() {
            server.getPiecesData();
        });
        server.on(MESSAGES.piecesData, function(pieces) {
            viewport.removeTooltips();
            _.each(pieces, function(pieceData) {
                var piece = puzzle.getPiece(pieceData.x, pieceData.y);
                piece.selected = false;
                piece.locked = pieceData.d;
                piece.realX = pieceData.realX;
                piece.realY = pieceData.realY;
                piece.render();

                if (piece.locked) {
                    viewport.addTooltip(piece.yCoord, piece.xCoord, pieceData.d);
                }
            });
        });
    }

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

    server.connect();
    
    menu.show();
	panel.show();
	
	menu.openPage('welcome');
	panel.loading();
});

function log(message) {
    if(window.console != null &&
        window.console.log != null) {
        console.log(message);
    }
}
