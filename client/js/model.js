(function() {
    
function Model(attributes) {
    Model.superproto.constructor.call(this);
    
    this.attributes = {};
    this.refresh(attributes);
}

Puzz.Utils.inherit(Model, Puzz.Observer);

var Proto = Model.prototype;

Proto.set = function(name, value) {
    this.attributes[name] = value;
    this.fire('change:' + name);
    return this;
};

Proto.get = function(name) {
    return this.attributes[name];
};

Proto.all = function() {
    return _.clone(this.attributes);
};

Proto.save = function() {};

Proto.refresh = function(attributes) {
    _.each(attributes, function(attribute, name) {
        this.set(name, attribute);
    }, this);
    this.fire('change');
};

window.Puzz.Model = Model;
    
})();