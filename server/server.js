var fs = require('fs');
var db = require('./db');
var auth = require('connect-auth');
var config = require('../config');
var express = require('express');

var utilsDb = JSON.parse(fs.readFileSync(config.UTILS_DB).toString());

var server = express.createServer();

server.configure(function() {
    server.register('.html', require('ejs'));
    server.set('views', __dirname + '/views');
    server.set('view engine', 'html');
    
    server.use(express.cookieParser());
    server.use(express.session({secret: '123123123'}));
    
    server.use(auth([
        auth.Twitter({
            consumerKey: config.TWITTER_KEY,
            consumerSecret: config.TWITTER_SECRET
        }),
        auth.Facebook({
            appId: config.FACEBOOK_ID,
            appSecret: config.FACEBOOK_SECRET,
            callback: 'http://puzzle.home/auth/facebook',
            scope: 'email'
        }),
        auth.Yahoo({
            consumerKey: config.YAHOO_KEY,
            consumerSecret: config.YAHOO_SECRET,
            callback: 'http://puzzle.home/auth/yahoo'
        }),
        auth.Google({
            consumerKey: config.GOOGLE_KEY,
            consumerSecret: config.GOOGLE_SECRET,
            callback: 'http://puzzle.home/auth/google',
            scope: ""
        })    
    ]));
});

var viewOptions = {
    config: {
        IO_HOST: config.IO_HOST,
        IO_PORT: config.IO_PORT,
        STATIC_HOST: config.STATIC_HOST + (config.STATIC_PORT != 80 ? ':' + config.STATIC_PORT : ''),
        version: utilsDb.staticVersion,
        production: !config.DEV
    }
};

server.get('/', function(req, res) {
    res.render('puzzle', viewOptions);
});

server.get('/puzzles/', function(req, res) {
    res.render('puzzles', viewOptions);
});

server.get('/auth/twitter', function(req, res, params) {
    req.authenticate(['twitter'], function(error, authenticated) { 
        if (!authenticated) {return;}

        var userId = req.cookies.user_id;
        var twitter = req.getAuthDetails().user;
        
        db.Users.findOne({twitterId: twitter.user_id}, function(error, user) {
            if (error) {
                res.redirect('/#:(');
                return;
            }
                        
            if (!user) {
                if (!userId) {
                    res.redirect('/#not-authenticated');
                    return;
                }
                
                db.Users.get(userId, function(user) {
                    if (!user) {
                        res.redirect('/#not-authenticated');
                        return;
                    }
                    
                    user.twitterId = twitter.user_id;
                    user.save(function(error) {
                        if (error) {
                            res.redirect('/#:(');
                        } else {
                            res.redirect('/#new-user');
                        }
                    });
                });
            } else {
                res.cookie('user_id', user._id, {path: '/'});
                res.redirect('/'); 
            }
        });
    });
});

server.get('/auth/facebook', function(req, res, params) {
    req.authenticate(['facebook'], function(error, authenticated) { 
        if (!authenticated) {return;}

        var userId = req.cookies.user_id;
        var facebookId = req.getAuthDetails().user.id;

        db.Users.findOne({facebookId: facebookId}, function(error, user) {
            if (error) {
                res.redirect('/#:(');
                return;
            }
                        
            if (!user) {
                if (!userId) {
                    res.redirect('/#not-authenticated');
                    return;
                }
                
                db.Users.get(userId, function(user) {
                    if (!user) {
                        res.redirect('/#not-authenticated');
                        return;
                    }
                    
                    user.facebookId = facebookId;
                    user.save(function(error) {
                        if (error) {
                            res.redirect('/#:(');
                        } else {
                            res.redirect('/#new-user');
                        }
                    });
                });
            } else {
                res.cookie('user_id', user._id, {path: '/'});
                res.redirect('/'); 
            }
        });
    });
});

server.get('/auth/yahoo', function(req, res, params) {
    req.authenticate(['yahoo'], function(error, authenticated) {
        console.log(error, authenticated, req.getAuthDetails());
    });
});

server.get('/auth/google', function(req, res, params) {
    req.authenticate(['google'], function(error, authenticated) {
        console.dir(req.getAuthDetails());
    });
});

server.listen(config.HTTP_PORT, config.HTTP_HOST);

module.exports = server;