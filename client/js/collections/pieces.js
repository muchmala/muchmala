Puzz.Collections.Pieces = Backbone.IO.Collection.extend({
    messages: {
        'piecesData': 'refresh'
    },
    
    fetch: function() {
        this.socket.getPiecesData();
    }
});