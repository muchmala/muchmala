$(function() {

    var layout = BorbitPuzzle.layout(
        $('#viewport'),
        $('#display'),
        $('#binder'),
        $('#loading')
    );
    
    BorbitPuzzle.controller(BorbitPuzzle.server(), layout);
    
});