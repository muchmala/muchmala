var config = exports;

config.server = {
    host: '172.16.127.128',
    port: 9999
};

config.db = {
    host: '127.0.0.1',
    port: '27017',
    name: 'puzzle',
    username: 'puzzle',
    password: '111111',
    options: {
        auto_reconnect: true
    }
};