window.Puzz = (function(ns) {

ns.Observer = function() {
    var ONCE = 'once';
    var MULTIPLE = 'multiple';

    var subscribers = {};
    subscribers[ONCE] = {};
    subscribers[MULTIPLE] = {};

    function fire() {
        var args = _.toArray(arguments);
        var event = args.shift();
        
        if(!_.isUndefined(subscribers[MULTIPLE][event])) {
            _.each(subscribers[MULTIPLE][event], function(subscriber) {
                subscriber.apply(null, args);
            });
        }
        if(!_.isUndefined(subscribers[ONCE][event])) {
            _.each(subscribers[ONCE][event], function(subscriber) {
                subscriber.apply(null, args);
            });
            delete subscribers[ONCE][event];
        }
    }

    function subscribe(event, trigger, type) {
        if(_.isUndefined(subscribers[type][event])) {
            subscribers[type][event] = [];
        }
        subscribers[type][event].push(trigger);
    }

    function subscribeOnce(event, trigger) {
        subscribe(event, trigger, ONCE);
    }

    function subscribeMultiple(event, trigger) {
        subscribe(event, trigger, MULTIPLE);
    }

    return {
        fire: fire,
        on: subscribeMultiple,
        subscribe: subscribeMultiple,
        once: subscribeOnce
    };
};

return ns;

})(window.Puzz || {});