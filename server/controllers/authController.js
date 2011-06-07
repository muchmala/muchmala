var db = require('muchmala-common').db;

module.exports = function(server) {
    server.post('/auth/signup', function(req, res) {
        req.form.complete(function(err, fields, files) {
            var errors = [];
            
            if (!fields.username) {
                errors.push('usernameEmpty');
            } else if (!/^[A-Za-z0-9_]{3,20}$/.test(fields.username)) {
                errors.push('usernameIncorrect');
            }
            
            if (!fields.email) {
                errors.push('emailEmpty');
            } else if (!/^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(fields.email)) {
                errors.push('emailIncorrect');
            }

            if (!fields.password) {
                errors.push('passwordEmpty');
            }
            
            if (errors.length && !fields.username) {
                res.end(JSON.stringify({errors: errors}));
                return;
            }
            
            db.Users.checkName(fields.username, function(available) {
                if (!available) {
                    errors.push('usernameDuplicate');
                }
                
                if (errors.length) {
                    res.end(JSON.stringify({errors: errors}));
                    return;
                }
                
                addPermanentUser(req.cookies.anonymous, fields.username, fields.email, fields.password, function() {
                    req.fields = fields;
                    req.authenticate(['form'], function(error, authenticated) {
                        if (authenticated) {
                            res.end(JSON.stringify('success'));
                        }
                    });
                });
            });
        });
    });

    server.get('/auth/twitter', function(req, res, params) {
        if (req.isAuthenticated()) {
            res.redirect('/');
            return;
        }
    
        req.authenticate(['twitter'], function(error, authenticated) { 
            if (!authenticated) {return;}

            var anonymousId = req.cookies.anonymous;
            var twitterId = req.getAuthDetails().user.user_id;
        
            getLinkedUser('twitterId', twitterId, anonymousId, function(user) {
                db.Sessions.add(user._id, req.sessionID, function() {
                    res.redirect('/');
                });
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

            var anonymousId = req.cookies.anonymous;
            var facebookId = req.getAuthDetails().user.id;

            getLinkedUser('facebookId', facebookId, anonymousId, function(user) {
                db.Sessions.add(user._id, req.sessionID, function() {
                    res.redirect('/');
                });
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
        
            var anonymousId = req.cookies.anonymous;
            var googleId = req.getAuthDetails().user.username;
        
            getLinkedUser('googleId', googleId, anonymousId, function(user) {
                db.Sessions.add(user._id, req.sessionID, function() {
                    res.redirect('/');
                });
            });
        });
    });
    
    server.get('/auth/yahoo', function(req, res, params) {
        if (req.isAuthenticated()) {
            res.redirect('/');
            return;
        }
    
        req.authenticate(['yahoo'], function(error, authenticated) {
            if (!authenticated) {return;}
        
            var anonymousId = req.cookies.anonymous;
            var yahooId = req.getAuthDetails().user.guid;
        
            getLinkedUser('yahooId', yahooId, anonymousId, function(user) {
                db.Sessions.add(user._id, req.sessionID, function() {
                    res.redirect('/');
                });
            });
        });
    });
    
    server.post('/auth/form', function(req, res, params) {
        req.form.complete(function(err, fields, files) {
            var errors = [];
            
            if (!fields.username) {
                errors.push('usernameEmpty');
            } else if (!/^[A-Za-z0-9_]{3,20}$/.test(fields.username)) {
                errors.push('usernameIncorrect');
            }

            if (!fields.password) {
                errors.push('passwordEmpty');
            }
            
            if (errors.length) {
                res.end(JSON.stringify({errors: errors}));
                return;
            }
            
            req.fields = fields;
            req.authenticate(['form'], function(error, authenticated) {
                if (authenticated) {
                    res.end(JSON.stringify('success'));
                } else {
                    res.end(JSON.stringify('failed'));
                }
            });
        });
    });
    
    server.get('/auth/logout', function(req, res) {
        db.Sessions.clear(req.sessionID, function() {
            req.logout();
            res.redirect('/');
        });
    });
};

function getLinkedUser(field, id, anonymousId, callback) {
    var query = {};
    query[field] = id;
    
    db.Users.findOne(query, function(error, user) {
        if (error) { callback(true); return; }
                    
        if (!user) {
            if (!anonymousId) { callback(false); return; }
            
            db.Users.getAnonymous(anonymousId, function(user) {
                if (!user) { callback(false); return; }
                
                user[field] = id;
                user.anonymous = false;
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

function addPermanentUser(id, name, email, password, callback) {
    if (id) {
        db.Users.getAnonymous(id, function(user) {
            if (user) {
                saveData(user);
            } else {
                saveData(new db.Users());
            }
        });
    } else {
        saveData(new db.Users());
    }
    
    function saveData(user) {
        user.name = name;
        user.email = email;
        user.password = password;
        user.anonymous = false;
        user.save(function() {
            callback();
        });
    }
}