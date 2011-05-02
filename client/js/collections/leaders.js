Puzz.Collections.Leaders = Backbone.IO.Collection.extend({
    messages: {
        'leadersBoard': 'refresh'
    },

    getSortedBy: function(sortBy) {
        return this.sortBy(function(model) {
            return model.get(sortBy);
        });
    }
});