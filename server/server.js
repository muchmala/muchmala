var fs = require('fs');
var db = require('./db');
var auth = require('connect-auth');
var config = require('../config');
var express = require('express');

var utilsDb = JSON.parse(fs.readFileSync(config.UTILS_DB).toString());

var server = express.createServer();

db.connect(function() {});

server.configure(function() {
    server.register('.html', require('ejs'));
    server.set('views', __dirname + '/views');
    server.set('view engine', 'html');
    
    server.use(express.cookieParser());
    server.use(express.session({secret: 'secret'}));
    
    server.use(auth([
        auth.Twitter({
            consumerKey: config.TWITTER_KEY,
            consumerSecret: config.TWITTER_SECRET
        }),
        auth.Facebook({
            appId: config.FACEBOOK_ID,
            appSecret: config.FACEBOOK_SECRET,
            callback: 'http://' + config.MAIN_DOMAIN + '/auth/facebook',
            scope: 'email'
        }),
        auth.Yahoo({
            consumerKey: config.YAHOO_KEY,
            consumerSecret: config.YAHOO_SECRET,
            callback: 'http://' + config.MAIN_DOMAIN + '/auth/yahoo'
        }),
        auth.Google({
            consumerKey: config.GOOGLE_KEY,
            consumerSecret: config.GOOGLE_SECRET,
            callback: 'http://' + config.MAIN_DOMAIN + '/auth/google',
            scope: ""
        })    
    ]));
});

var viewСonfig = {
    IO_HOST: config.IO_HOST,
    IO_PORT: config.IO_PORT,
    STATIC_HOST: config.STATIC_HOST + (config.STATIC_PORT != 80 ? ':' + config.STATIC_PORT : ''),
    version: utilsDb.staticVersion,
    production: !config.DEV
};

server.get('/', function(req, res) {
    res.render('puzzle', {
        loggedin: req.isAuthenticated(),
        config: viewСonfig
    });
});

server.get('/logout', function(req, res) {
    req.logout();
    res.cookie('user_id', null);
    res.redirect('/');
});

server.get('/auth/twitter', function(req, res, params) {
    if (req.isAuthenticated()) {
        res.redirect('/');
        return;
    }
    
    req.authenticate(['twitter'], function(error, authenticated) { 
        if (!authenticated) {return;}

        var userId = req.cookies.user_id;
        var twitterId = req.getAuthDetails().user.user_id;
        
        getLinkedUser('twitterId', twitterId, userId, function(user) {
            if (!user) {
                res.redirect('/#not-authenticated');
            } else {
                res.cookie('user_id', user._id, {path: '/'});
                res.redirect('/');
            }
        });
    });
});

server.get('/auth/facebook', function(req, res, params) {
    if (req.isAuthenticated()) {
        res.redirect('/');
        return;
    }
    
    req.authenticate(['facebook'], function(error, authenticated) { 
        if (!authenticated) {return;}

        var userId = req.cookies.user_id;
        var facebookId = req.getAuthDetails().user.id;

        getLinkedUser('facebookId', facebookId, userId, function(user) {
            if (!user) {
                res.redirect('/#not-authenticated');
            } else {
                res.cookie('user_id', user._id, {path: '/'});
                res.redirect('/');
            }
        });
    });
});

server.get('/auth/google', function(req, res, params) {
    if (req.isAuthenticated()) {
        res.redirect('/');
        return;
    }
    
    req.authenticate(['google'], function(error, authenticated) {
        if (!authenticated) {return;}
        
        var userId = req.cookies.user_id;
        var googleId = req.getAuthDetails().user.username;
        
        getLinkedUser('googleId', googleId, userId, function(user) {
            if (!user) {
                res.redirect('/#not-authenticated');
            } else {
                res.cookie('user_id', user._id, {path: '/'});
                res.redirect('/');
            }
        });
    });
});

function getLinkedUser(field, id, userId, callback) {
    var query = {};
    query[field] = id;
    
    db.Users.findOne(query, function(error, user) {
        if (error) {
            callback(true);
            return;
        }
                    
        if (!user) {
            if (!userId) {
                callback(false);
                return;
            }
            
            db.Users.get(userId, function(user) {
                if (!user) {
                    callback(false);
                    return;
                }
                
                user[field] = id;
                user.save(function(error) {
                    if (error) {
                        callback(false);
                    } else {
                        callback(user);
                    }
                });
            });
        } else {
            callback(user);
        }
    });
}

server.get('/auth/yahoo', function(req, res, params) {
    req.authenticate(['yahoo'], function(error, authenticated) {
        console.log(error, authenticated, req.getAuthDetails());
    });
});

server.listen(config.HTTP_PORT, config.HTTP_HOST);

module.exports = server;