(function() {
    
var strg = window.Puzz.Storage.user;

Puzz.Models.User = Backbone.IO.Model.extend({
    
    defaults: {
        'score': 0,
        'id': strg.id(),
        'name': 'anonymous'
    },
    
    messages: {
        'userData': 'refresh',
        'scoreAdded': 'addScore',
        'setUserName': 'setName'
    },
    
    refresh: function(data) {
        strg.id(data.id); 
        this.set(data);
    },
    
    addScore: function(data) {
        var added = _.reduce(data, function(memo, piece) {
            return memo + piece.pts;
        }, 0);
        this.set({'score': this.get('score') + added});
    },
    
    setName: function(data) {
        if (data && data.error) {
            this.trigger('error', this, data.error);
        } else {
            this.trigger('saved', this);
        }
    },
    
    validate: function(attrs) {
        if (!/^[A-Za-z0-9_]{3,20}$/.test(attrs['name'])) {
            return 'incorrect';
        }
    },
    
    sync: function(method, model) {
        model.socket.setUserName(model.get('name'));
    }
    
});

})();