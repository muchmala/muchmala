Instalation
===========

0. Install mongoDB, nginx, node.js
----------------------------------

1. Install node.js modules
--------------------------

I use npm (http://npmjs.org/) so it is really simple:

    npm install opts
    npm install socket.io
    npm install mongodb

You can look for modules here:

    https://bitbucket.org/mazzarelli/js-opts/wiki/Home
    http://socket.io/
    https://github.com/christkv/node-mongodb-native

2. Pull git repository.
-----------------------

3. Create nginx config like this and restart it:
------------------------------------------------

    server {
        server_name puzzle.dev;
        root /home/kunik/www/my/puzzle.js;

        access_log  /var/log/nginx/puzzle.dev.access.log;

        location /socket.io {
            proxy_pass_header Server;
            proxy_set_header Host $http_host;
            proxy_redirect off;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Scheme $scheme;
            proxy_pass http://172.16.127.128:9999;
        }
    }

3. Create mongodb database and collections
------------------------------------------
Currently we need 3 collections:

    maps
    pieces
    users

4. Check config in ./server/config.js
-------------------------------------

Basicly you need to check port. Check if it is not used

    netstat -an | grep :9999

5. Start server
---------------

    node ./server/app.js

If it is OK, it should write something like:

    16 Dec 22:44:13 - socket.io ready - accepting connections

If somth is wrong it'll yell:

    node.js:50
        throw e; // process.nextTick error, or 'error' event on first tick
        ^
    Error: EADDRNOTAVAIL, Cannot assign requested address
        at Server._doListen (net.js:1148:42)
        at net.js:1119:14
    ...bla-bla

So try to check config.

6. Finally open page in your browser: http://puzzle.dev
--------------------------------------------------------------

You should see your puzzle ;)
