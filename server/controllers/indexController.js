var fs = require('fs');
var config = require('../../config');
var ioCluster = require('socket.io-cluster');

module.exports = function(server) {
    var frontendServer = ioCluster.makeFrontendServer(server, config);
    var utilsDb = JSON.parse(fs.readFileSync(config.UTILS_DB).toString());
    
    var viewСonfig = {
        IO_HOST: config.IO_HOST,
        IO_PORT: config.IO_PORT,
        STATIC_HOST: config.STATIC_HOST + (config.STATIC_PORT != 80 ? ':' + config.STATIC_PORT : ''),
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