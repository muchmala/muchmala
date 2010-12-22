$(function() {
    var layout = BorbitPuzzle.layout(
        $('#viewport'),
        $('#display'),
        $('#binder'),
        $('#loading')
    );
    
    BorbitPuzzle.handlers(BorbitPuzzle.server(), layout);
});