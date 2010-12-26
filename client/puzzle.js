$(function() {
    var layout = Puzzle.Layout(
        $('#viewport'),
        $('#display'),
        $('#binder'),
        $('#loading'));

    var panel = Puzzle.Panel($('#panel'));
    
    Puzzle.handlers(Puzzle.Server(), layout, panel);
});