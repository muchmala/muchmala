var fs = require('fs'),
    httpProxy = require('http-proxy'),
    opts = require('opts');

opts.parse([
    {
        'short': 'c',
        'long': 'config',
        'description': 'proxy config. \n\
Example: \n\
  { \n\
      "silent": false, \n\
      "hostnameOnly": true, \n\
      "router": { \n\
          "muchmala.com" : "127.0.0.1:8081", \n\
          "io2.muchmala.com" : "127.0.0.1:8083", \n\
          "io1.muchmala.com" : "127.0.0.1:8082" \n\
      } \n\
  } \n\
',
        'value': true,
        'required': true
    }
], true);

var configFile = opts.get('config');

if (configFile) {
    try {
        var data = fs.readFileSync(configFile);
        config = JSON.parse(data.toString());
    } catch (ex) {
        console.log('Error starting node-http-proxy: ' + ex);
        process.exit(1);
    }
}

var server = httpProxy.createServer(function (req, res, proxy) {
    proxy.proxyRequest(req, res);
}, config);

server.on('upgrade', function(req, socket, head) {
    server.proxy.proxyWebSocketRequest(req, socket, head, server.proxy.proxyTable.getProxyLocation(req));
});

server.listen(80);
