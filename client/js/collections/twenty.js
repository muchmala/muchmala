Puzz.Collections.Twenty = Backbone.Collection.extend({
    url: '/users/toptwenty',
    
    messages: {
        'topTwenty': 'refresh'
    },
    
    getSortedBy: function(sortBy) {
        return this.sortBy(function(model) {
            return model.get(sortBy);
        });
    }
});