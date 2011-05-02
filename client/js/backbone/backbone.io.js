(function() {
    
    Backbone.IO = {};
    
    function Model(socket, attributes, options) {
        this.socket = socket;
        
        if (this.messages) {
            _.each(this.messages, function(method, message){
                this.socket.on(message, _.bind(this[method], this));
            }, this);
        }
        
        Model.superproto.constructor.call(this, attributes, options);
    };
    
    Backbone.IO.Model = Model;
    Puzz.Utils.inherit(Model, Backbone.Model);
    _.extend(Backbone.IO.Model, Backbone.Model);
    
    function Collection(socket, models, options) {
        this.socket = socket;
        
        if (this.messages) {
            _.each(this.messages, function(method, message){
                this.socket.on(message, _.bind(this[method], this));
            }, this);
        }
        
        Collection.superproto.constructor.call(this, models, options);
    };
    
    Backbone.IO.Collection = Collection;
    Puzz.Utils.inherit(Collection, Backbone.Collection);
    _.extend(Backbone.IO.Collection, Backbone.Collection);
    
    var Proto = Backbone.IO.Collection.prototype;
        
})();