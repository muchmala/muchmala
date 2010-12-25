$(function() {
    var layout = BorbitPuzzle.layout({
        viewport: $('#viewport'),
        display: $('#display'),
        binder: $('#binder'),
        loading: $('#loading'),
        panel: $('#panel')
    });
    
    BorbitPuzzle.handlers(BorbitPuzzle.server(), layout);
});