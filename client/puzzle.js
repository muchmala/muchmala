$(function() {

    BorbitPuzzle.layout(
        $('#viewport'),
        $('#display'),
        $('#binder')
    );
    
    BorbitPuzzle.controller(
        BorbitPuzzle.server(),
        $('#viewport')
    );
        
});