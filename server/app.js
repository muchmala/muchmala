var db = require('./db');
var io = require('socket.io');
var config = require('./config');
var express = require('express');

var Handlers = require('./handlers');
var Session = require('./session');

var server = express.createServer();

server.register('.html', require('ejs'));
server.set('views', __dirname + '/views');
server.set('view engine', 'html');
server.use(express.static(__dirname + '/../client'));
server.use(express.static(__dirname + '/../shared'));

server.get('/', function(req, res){
    res.render('puzzle', {config: config.server});
});

server.listen(config.server.port, config.server.ip);

db.connect(function() {
    var socket = io.listen(server);
    socket.on('connection', function(client) {
        new Handlers(new Session(client));
    });
});