$(function() {
    var Puzz = window.Puzz;
    
    if ($.browser.msie && $.browser.version < 9.0) {
        $('#browser').show();
        return;
    }

    var server       = new Puzz.Server();
	var puzzleModel  = new Puzz.Models.Puzzle(server);
	var piecesModel  = new Puzz.Models.Pieces(server);
	var leadersModel = new Puzz.Models.Leaders(server);
	var userModel    = new Puzz.Models.User(server);
	
	var viewport = new Puzz.Views.Viewport(puzzleModel, userModel, leadersModel)
	var puzzleView = Puzz.Views.Puzzle(puzzleModel, viewport.content);
	var selected;
    
    server.on('connected', function() {
        var puzzleId = models.puzzle.id;
        if (window.location.hash.length) {
            puzzleId = window.location.hash.replace('#', '');
        }
        server.initialize(Puzz.Storage.user.id(), puzzleId);
    });

    puzzleModel.once('change', function() {
        puzzleView.pieceSize = puzzleModel.pieceSize;
        puzzleModel.once('change:pieces', loadPuzzle);
        puzzleModel.fetchPieces();
    });
    
    var loadPuzzle = (function(
        var load = new Puzz.Loader();
		var rows = Math.ceil(puzzleModel.vLength / puzzleModel.spriteSize);
        var cols = Math.ceil(puzzleModel.hLength / puzzleModel.spriteSize);
        var spriteSize = puzzleModel.get('spriteSize');
        var puzzleId = puzzleModel.get('id');
        
        var objectsLoaded = 1;

		function calcLoading() {
			return Math.floor(objectsLoaded / (4 + rows * cols) / 100);
		}
        
        return flow.define(function() {
            load.covers(puzzleId, this);
    		viewport.loading(calcLoading());
        }, function(covers) {
            
            Puzz.Views.Piece.setImages({
                lockCover: covers.lock,
                selectCover: covers.select,
                defaultCover: covers['default']
            });
		    
    		objectsLoaded += 3;
    		viewport.loading(calcLoading());
            Puzz.Views.Piece.setSpriteSize(spriteSize);
            
            this.load.sprites(puzzleId, rows, cols, function(row, col, sprite) {
    			objectsLoaded++;
                viewport.loading(calcLoading());
                Puzz.Views.Piece.setSprite(row, col, sprite);

                var piecesToShow = _.select(pieces, function(piece) {
                    return piece.realX >= col * spriteSize && piece.realY >= row * spriteSize
                                && piece.realX <= (col * spriteSize) + spriteSize - 1
                                && piece.realY <= (row * spriteSize) + spriteSize - 1;
                });

                _.each(piecesToShow, function(pieceData) {
                    var piece = puzzleView.addPiece(pieceData);
				
    				if (pieceData.d == models.user.name) {
    				    selected = piece;
                    	piece.selected = true;
    					piece.locked = null;
    					piece.render();
    				}
                });
            }, this);

        }, function() {
            enablePuzzle();
    		puzzleView.buildIndex();
            puzzleModel.fetchPieces();
            viewport.loadingComplete();
        });
    })();

    function enablePuzzle() {
        $(document.body).removeClass('fallback')
        
        puzzleView.on('leftClick', processClickedPiece);
        puzzleView.on('rightClick', releaseSelectedPiece);

        server.on(MESSAGES.lockPiece, function(locked) {
            var piece = puzzle.getPiece(locked.coords[0], locked.coords[1]);
            if (locked.userName == userModel.get('name')) {
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
            if (unlocked.userName == userModel.get('name')) {
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
				
				if (pieceData.d == models.user.name) {
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
