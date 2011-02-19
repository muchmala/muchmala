Utils = {};
Utils.Observer = function() {
    var subscribers = {};

    function fire() {
        var eventName = Array.prototype.shift.call(arguments);
        if(subscribers[eventName] != null) {
            var count = subscribers[eventName].length;
            for(var j = 0; j < count; j++) {
                subscribers[eventName][j].apply(null, arguments);
            }
        }
    }

    function subscribe(eventName, trigger) {
        if(subscribers[eventName] == null) {
            subscribers[eventName] = [];
        }
        subscribers[eventName].push(trigger);
    }

    return {
        fire: fire,
        subscribe: subscribe
    };
};