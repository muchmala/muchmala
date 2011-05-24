var fs = require('fs');
var httpProxy = require('http-proxy');
var config = require('../../config');
var opts = require('opts');

/* Example:
   {
       "silent": false,
       "hostnameOnly": true,
       "router": {
           "muchmala.com" : "127.0.0.1:8081",
           "io2.muchmala.com" : "127.0.0.1:8083",
           "io1.muchmala.com" : "127.0.0.1:8082"
       }
   }
*/

opts.parse([
    {
        'short': 'c',
        'long': 'config',
        'description': 'proxy config',
        'value': true,
        'required': true
    }
], true);

var configFile = opts.get('config');

if (configFile) {
    try {
        var data = fs.readFileSync(configFile);
        var proxyConfig = JSON.parse(data.toString());
    } catch (ex) {
        console.log('Error starting node-http-proxy: ' + ex);
        process.exit(1);
    }
}

var server = httpProxy.createServer(function(req, res, proxy) {
    proxy.proxyRequest(req, res);
}, proxyConfig);

server.on('upgrade', function(req, socket, head) {
    server.proxy.proxyWebSocketRequest(req, socket, head, server.proxy.proxyTable.getProxyLocation(req));
});

server.listen(80, config.HTTP_HOST);
