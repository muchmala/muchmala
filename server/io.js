var fs = require('fs');
var iocluster = require('socket.io-cluster');
var express = require('express');
var _ = require('../shared/underscore')._;

var config = require('../config');
var utilsDb = JSON.parse(fs.readFileSync(config.UTILS_DB).toString());

var server = express.createServer();

server.register('.html', require('ejs'));
server.set('views', __dirname + '/views');
server.set('view engine', 'html');

var viewOptions = {
    config: {
        production: !config.DEV,
        IO_HOST: config.IO_HOST,
        IO_PORT: config.IO_PORT,
        STATIC_HOST: config.STATIC_HOST + (config.STATIC_PORT != 80 ? ':' + config.STATIC_PORT : ''),
        version: utilsDb.staticVersion
    }
};

server.get('/', function(req, res) {
    res.render('puzzle', viewOptions);
});

server.listen(config.HTTP_PORT, config.HTTP_HOST);
iocluster.listen(server, config);