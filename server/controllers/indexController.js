var fs = require('fs');
var config = require('../../config');
var ioCluster = require('socket.io-cluster');

module.exports = function(server) {
    var frontendServer = ioCluster.makeFrontendServer(server, config);
    var utilsDb = JSON.parse(fs.readFileSync(config.UTILS_DB).toString());

    var viewСonfig = {
        STATIC_URL: config.STATIC_URL,
        version: utilsDb.staticVersion,
        production: !config.DEV
    };

    server.get('/', function(req, res) {
        res.render('puzzle', {
            config: viewСonfig,
            loggedin: req.isAuthenticated(),
            socketIoServers: JSON.stringify(frontendServer.getIoServersList())
        });
    });
};