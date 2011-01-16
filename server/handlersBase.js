exports.create = function(client) {

    function send(event, data) {
        client.send(this.createMessage(event, data));
    }

    function broadcast(event, data) {
        client.broadcast(this.createMessage(event, data));
    }

    function createMessage(event, data) {
        return JSON.stringify({
            event: event,
            data: data
        });
    }

    function process(message) {
        var handlerExists = message.action != null && this.handlers[message.action] != null;
        var handlerAvailable = this.initialized || message.action == 'initialize';

        if(handlerExists && handlerAvailable) {
            this.handlers[message.action].call(null, message.data);
        }
    }

    return {
        handlers: {},
        initialized: false,
        send: send,
        broadcast: broadcast,
        createMessage: createMessage,
        process: process
    };
};