$(function() {
    var Puzz = window.Puzz;
    
    if ($.browser.msie && $.browser.version < 9.0) {
        $('#browser').show();
        return;
    }

    var server       = new Puzz.Server();
	var puzzleModel  = new Puzz.Models.Puzzle(server);
	var leadersModel = new Puzz.Models.Leaders(server);
	var twentyModel  = new Puzz.Models.Twenty(server);
	var userModel    = new Puzz.Models.User(server);
	
	var viewport = new Puzz.Views.Viewport(puzzleModel, userModel, leadersModel, twentyModel)
	var puzzleView = Puzz.Views.Puzzle(puzzleModel, viewport.content);
	var selected;
    
    server.on('connected', function() {
        var puzzleId = puzzleModel.get('id');
        if (window.location.hash.length) {
            puzzleId = window.location.hash.replace('#', '');
        }
        server.initialize(Puzz.Storage.user.id(), puzzleId);
    });

    puzzleModel.once('change', function() {
        puzzleModel.once('change:pieces', loadPuzzle);
        puzzleModel.fetchPieces();
    });
    
    var loadPuzzle = (function() {
        var load = new Puzz.Loader();
		var rows, cols, spriteSize, puzzleId, objectsLoaded;

		function calcLoading(loadedCount) {
		    objectsLoaded += loadedCount;
			return Math.floor(objectsLoaded / (4 + rows * cols) / 100);
		}
        
        return flow.define(function() {
            puzzleId   = puzzleModel.get('id');
            spriteSize = puzzleModel.get('spriteSize');
            rows = Math.ceil(puzzleModel.get('vLength') / spriteSize);
            cols = Math.ceil(puzzleModel.get('hLength') / spriteSize);
            
            viewport.loading(calcLoading(1));
            load.covers(puzzleId, this);
        }, function(covers) {
            
            Puzz.Views.Piece.setImages({
                lockCover: covers.lock,
                selectCover: covers.select,
                defaultCover: covers['default']
            });
		    
    		viewport.loading(calcLoading(3));
            Puzz.Views.Piece.setSpriteSize(spriteSize);
            
            load.sprites(puzzleId, rows, cols, function(row, col, sprite) {
                viewport.loading(calcLoading(1));
                Puzz.Views.Piece.setSprite(row, col, sprite);

                var piecesToShow = _.select(puzzleModel.get('pieces'), function(piece) {
                    return piece.realX >= col * spriteSize && piece.realY >= row * spriteSize
                                && piece.realX <= (col * spriteSize) + spriteSize - 1
                                && piece.realY <= (row * spriteSize) + spriteSize - 1;
                });

                _.each(piecesToShow, function(pieceData) {
                    var piece = puzzleView.addPiece(pieceData);
				
    				if (pieceData.d == models.user.name) {
    				    selected = piece;
                    	piece.selected = true;
    					piece.locked = false;
    					piece.render();
    				}
                });
            }, this);

        }, function() {
            enablePuzzle();
    		puzzleView.buildIndex();
            puzzleModel.fetchPieces();
        });
    })();

    function enablePuzzle() {
        $(document.body).removeClass('fallback')
        
        viewport.loadingComplete();
        puzzleView.on('leftClick', processClickedPiece);
        puzzleView.on('rightClick', releaseSelectedPiece);

        server.on(MESSAGES.lockPiece, function(locked) {
            var x = locked.coords[0];
            var y = locked.coords[1];
            var piece = puzzleView.getPiece(x, y);
            
            if (locked.userName == userModel.get('name')) {
				viewport.showSelectedIndicator(piece.type());
                selected = piece, selected.select();
            } else {
                viewport.addTooltip(x, y, locked.userName);
                piece.lock();
            }
        });
        
        server.on(MESSAGES.unlockPiece, function(unlocked) {
            var x = locked.coords[0];
            var y = locked.coords[1];
            var piece = puzzleView.getPiece(x, y);
            
            if (unlocked.userName == userModel.get('name')) {
				viewport.hideSelectedIndicator();
                piece.unselect();
            } else {
                viewport.removeTooltip(x, y)
                piece.unlock();
            }
        });
        
        server.on(MESSAGES.swapPieces, function(coords) {
            puzzle.swapPiecesByCoords(coords);
        });
        
        server.on(MESSAGES.initialized, function() {
            puzzleModel.fetchPieces();
        });
        
        puzzleModel.on('change:pieces', function() {
            viewport.removeTooltips();
            
            _.each(puzzleModel.get('pieces'), function(pieceData) {
                var x = pieceData.x;
                var y = pieceData.y;
                var piece = puzzleView.getPiece(x, y);
				
				piece.selected = false;
				piece.locked = null;
				
				if (pieceData.d == userModel.get('name')) {
                	piece.selected = true;
					selected = piece;
				} else if (pieceData.d) {
					piece.locked = true;
					viewport.addTooltip(x, y, pieceData.d);
				}

                piece.realX = pieceData.realX;
                piece.realY = pieceData.realY;
                piece.render();
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
