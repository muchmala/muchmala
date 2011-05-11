(function() {

Puzz.Models.User = Backbone.IO.Model.extend({
    
    defaults: {
        'id': $.cookie('user_id'),
        'name': 'anonymous',
        'score': 0
    },
    
    messages: {
        'userData': 'refresh',
        'scoreAdded': 'addScore',
        'setUserName': 'setName'
    },
    
    refresh: function(data) {
        $.cookie('user_id', data.id); 
        this.set(data);
    },
    
    addScore: function(data) {
        var added = _.reduce(data, function(memo, piece) {
            return memo + piece.pts;
        }, 0);
        this.set({'score': this.get('score') + added});
        this.trigger('score', data);
    },
    
    setName: function(data) {
        if (data && data.error) {
            this.set({'name': this.previous('name')});
            this.trigger('error', this, data.error);
        } else {
            this.trigger('saved', this);
            this.change();
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