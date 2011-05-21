module.exports = function(server) {
    server.get('/auth/logout', function(req, res) {
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

    server.get('/auth/yahoo', function(req, res, params) {
        req.authenticate(['yahoo'], function(error, authenticated) {
            console.log(error, authenticated, req.getAuthDetails());
        });
    });
};

function getLinkedUser(field, id, userId, callback) {
    var query = {};
    query[field] = id;
    
    db.Users.findOne(query, function(error, user) {
        if (error) { callback(true); return; }
                    
        if (!user) {
            if (!userId) { callback(false); return; }
            
            db.Users.get(userId, function(user) {
                if (!user) { callback(false); return; }
                
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