$(function() {
    var Puzz = window.Puzz;
    
    if ($.browser.msie && $.browser.version < 9.0) {
        $('#browser').show();
        return;
    }

    var server = new Puzz.Server();

	var models = {
		puzzle: new Puzz.Models.Puzzle(server),
		leaders: new Puzz.Models.Leaders(server),
		user: new Puzz.Models.User(server)
	};
	
	var viewport = new Puzz.Views.Viewport(
		models.puzzle, models.user, models.leaders, server)
	
	var puzzle, selected;
    
    server.on('connected', function() {
        if (window.location.hash.length) {
            puzzleId = window.location.hash.replace('#', '');
        }
        server.initialize(Puzz.Storage.user.id(), puzzleId);
    });

    models.puzzle.once('change', function() {
        puzzle = Puzz.View.Puzzle({
            pieceSize: models.puzzle.pieceSize,
            viewport: viewport.content
        });

        var load = new Puzz.Loader();

		var rows = Math.ceil(data.vLength / data.spriteSize);
        var cols = Math.ceil(data.hLength / data.spriteSize);
        var percentLoaded = (4 + rows * cols) / 100;
        var objectsLoaded = 0;

		function calcLoading() {
			return Math.floor(objectsLoaded / percentLoaded);
		}
        
        server.once(MESSAGES.piecesData, function(pieces) {
            flow.exec(function() {
				objectsLoaded += 1;
                load.covers(puzzleId, this);
				viewport.loading(calcLoading());
            }, function(covers) {
				
                Puzz.Piece.setImages({
                    lockCover: covers.lock,
                    selectCover: covers.select,
                    defaultCover: covers['default']
                });
				
				objectsLoaded += 3;
                Puzz.Piece.setSpriteSize(data.spriteSize);
                viewport.loading(calcLoading());

                load.sprites(puzzleId, rows, cols, function(row, col, sprite) {
					objectsLoaded++;
                    Puzz.Piece.setSprite(row, col, sprite);
                    viewport.loading(calcLoading());

                    var piecesToShow = _.select(pieces, function(piece) {
                        return piece.realX >= col * data.spriteSize &&
                               piece.realY >= row * data.spriteSize &&
                               piece.realX <= (col * data.spriteSize) + data.spriteSize - 1 &&
                               piece.realY <= (row * data.spriteSize) + data.spriteSize - 1;
                    });

                    _.each(piecesToShow, function(pieceData) {
                        var piece = puzzle.addPiece(pieceData);
						
						if (pieceData.d == userName) {
		                	piece.selected = true;
							piece.locked = null;
							piece.render();
							selected = piece;
						}
                    });
                }, this);

            }, function() {
                enablePuzzle();
				puzzle.buildIndex();
                server.getPiecesData();
                viewport.loadingComplete();
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
				viewport.showSelectedIndicator(piece.type());
                selected = piece;
                selected.select();
            } else {
                piece.lock();
                viewport.addTooltip(piece.yCoord, piece.xCoord, locked.userName);
            }
        });
        server.on(MESSAGES.unlockPiece, function(unlocked) {
            var piece = puzzle.getPiece(unlocked.coords[0], unlocked.coords[1]);
            if (unlocked.userName == userName) {
				viewport.hideSelectedIndicator();
                piece.unselect();
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
				piece.locked = null;
				
				if (pieceData.d == userName) {
                	piece.selected = true;
					selected = piece;
				} else if (!_.isNull(pieceData.d)) {
					piece.locked = pieceData.d;
				}

                piece.realX = pieceData.realX;
                piece.realY = pieceData.realY;
                piece.render();

                if (piece.locked) {
                    viewport.addTooltip(piece.yCoord, piece.xCoord, pieceData.d);
                }
            });
        });
    }

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
    viewport.showMenu();
	viewport.showPanel();
	viewport.loading();
});

function log(message) {
    if(window.console != null &&
        window.console.log != null) {
        console.log(message);
    }
}
