(function() {

function Observer() {
    this.subscribers = {};
    this.subscribers[this.ONCE] = {};
    this.subscribers[this.MULTIPLE] = {};
}

var Proto = Observer.prototype;

Proto.ONCE = 'once';
Proto.MULTIPLE = 'multiple';

Proto.fire = function() {
    var args = _.toArray(arguments);
    var event = args.shift();
    
    if(!_.isUndefined(this.subscribers[this.MULTIPLE][event])) {
        _.each(this.subscribers[this.MULTIPLE][event], function(subscriber) {
            subscriber.apply(null, args);
        });
    }
    if(!_.isUndefined(this.subscribers[this.ONCE][event])) {
        _.each(this.subscribers[this.ONCE][event], function(subscriber) {
            subscriber.apply(null, args);
        });
        delete this.subscribers[this.ONCE][event];
    }
};

Proto.subscribe = function(event, trigger, type) {
    if(_.isUndefined(this.subscribers[type][event])) {
        this.subscribers[type][event] = [];
    }
    this.subscribers[type][event].push(trigger);
};

Proto.subscribeOnce = function(event, trigger) {
    this.subscribe(event, trigger, this.ONCE);
};

Proto.subscribeMultiple = function(event, trigger) {
    this.subscribe(event, trigger, this.MULTIPLE);
};

Proto.on = Proto.subscribeMultiple;
Proto.once = Proto.subscribeOnce;

window.Puzz.Observer = Observer;

})();