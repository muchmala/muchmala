$(function() {
    var layout = Puzzle.Layout(
        $('#viewport'),
        $('#display'),
        $('#binder'),
        $('#loading'));

    var panel = Puzzle.Panel($('#panel'));
    
    Puzzle.Handlers(Puzzle.Server(), layout, panel);
});