(function() {
    
function Model(attributes) {
    this.attributes = {};
    this.refresh(attributes);
}

Proto = Model.prototype;

Proto.set = function(name, value) {
    this[name] = value;
    this.fire('change:' + name);
};

Proto.get = function(name) {
    return this[name];
};

Proto.refresh = function(attributes) {
    _.each(attributes, _.bind(function(attribute, name) {
        this.set(name, attribute);
    }, this));
    this.fire('change');
};

Puzz.Utils.inherit(Model, Puzz.Observer);

window.Puzz.Model = Model;
    
})();