Puzz.Collections.Twenty = Backbone.IO.Collection.extend({
    messages: {
        'topTwenty': 'refresh'
    },
    
    fetch: function() {
        this.socket.getTopTwenty();
    },
    
    getSortedBy: function(sortBy) {
        return this.sortBy(function(model) {
            return model.get(sortBy);
        });
    }
});