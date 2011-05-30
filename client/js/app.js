$(function() {
    var Puzz = window.Puzz;
    
    if ($.browser.msie && $.browser.version < 9.0) {
        $('#browser').show();
        return;
    }
    
    var server = new Puzz.Server();
    var userModel = new Puzz.Models.User(server);
    var puzzleModel = new Puzz.Models.Puzzle(server);
    var twentyCollection = new Puzz.Collections.Twenty();
    var piecesCollection = new Puzz.Collections.Pieces(server);
    var leadersCollection = new Puzz.Collections.Leaders(server);
        
    var viewport = new Puzz.Views.Viewport(puzzleModel, userModel, leadersCollection, twentyCollection)
    var puzzleView = new Puzz.Views.Puzzle(puzzleModel, viewport.content);
    var selected;

    server.bind('connected', function() {
        server.initialize(userModel.get('aid'), userModel.get('sid'), puzzleModel.get('id'));
    });

    puzzleModel.once('change', function() {
        piecesCollection.once('refresh', loadPuzzle);
        piecesCollection.fetch();
    });
    
    var loadPuzzle = (function() {
        var load = new Puzz.Loader();
        var rows, cols, spriteSize, puzzleId, objectsLoaded = 0;

        function calcLoading(loadedCount) {
            objectsLoaded += loadedCount;
            return Math.floor(objectsLoaded * 100 / (4 + rows * cols));
        }
        
        return flow.define(function() {
            puzzleId   = puzzleModel.get('id');
            spriteSize = puzzleModel.get('spriteSize');
            rows = Math.ceil(puzzleModel.get('vLength') / spriteSize);
            cols = Math.ceil(puzzleModel.get('hLength') / spriteSize);
            
            viewport.loading(calcLoading(1));
            load.covers(puzzleModel.get('pieceSize'), this);
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

                var piecesToShow = _.select(piecesCollection.toJSON(), function(piece) {
                    return piece.realX >= col * spriteSize && piece.realY >= row * spriteSize
                                && piece.realX <= (col * spriteSize) + spriteSize - 1
                                && piece.realY <= (row * spriteSize) + spriteSize - 1;
                });

                _.each(piecesToShow, function(pieceData) {
                    var piece = puzzleView.addPiece(pieceData);
                
                    if (pieceData.d == userModel.get('name')) {
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
            piecesCollection.fetch();
        });
    })();

    function enablePuzzle() {
        viewport.loadingComplete();
        puzzleView.bind('leftClick', processClickedPiece);
        puzzleView.bind('rightClick', releaseSelectedPiece);

        server.bind(MESSAGES.lockPiece, function(locked) {
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
        
        server.bind(MESSAGES.unlockPiece, function(unlocked) {
            var x = unlocked.coords[0];
            var y = unlocked.coords[1];
            var piece = puzzleView.getPiece(x, y);
            
            if (unlocked.userName == userModel.get('name')) {
                viewport.hideSelectedIndicator();
                piece.unselect();
            } else if (_.isUndefined(unlocked.userName)) {
                viewport.removeTooltip(x, y);
                piece.unselect();
                piece.unlock();
            } else {        
                viewport.removeTooltip(x, y);
                piece.unlock();
            }
        });
        
        server.bind(MESSAGES.swapPieces, function(coords) {
            puzzleView.swapPiecesByCoords(coords);
        });
        
        server.bind(MESSAGES.initialized, function() {
            piecesCollection.fetch();
        });
        
        piecesCollection.bind('refresh', function() {
            viewport.removeTooltips();
            
            _.each(piecesCollection.toJSON(), function(pieceData) {
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
                if(puzzleView.isSameType(selected, piece)) {
                    selected.unselect();
                    server.swapPieces(selected.x, selected.y, piece.x, piece.y);
                }
            }
        }
    }

    server.connect();
    viewport.showPanel();
});

function log(message) {
    if(window.console != null &&
        window.console.log != null) {
        console.log(message);
    }
}
