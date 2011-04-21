var mongoose = require('mongoose');
var models = require('./models');
var _ = require('../../shared/underscore')._;

var Query = mongoose.Query;
var Users = models.Users;
var UsersToPuzzles = models.UsersToPuzzles;

Users.all = function(callback) {
    Users.find({}, [], {sort: {'score': -1}}, function(error, users) {
        if(error) {throw error;}
        callback(users);
    });
};

Users.allLinkedWith = function(puzzleId, callback) {
    var query = new Query();
    query.where('puzzleId', puzzleId);
    UsersToPuzzles.find(query, function(error, links) {
        if(error) {throw error;}

        var usersIds = _.map(links, function(link) {
            return link.userId;
        });

        var query = new Query();
        query.in('_id', usersIds);
        Users.find(query, function(error, users) {
            if(error) {throw error;}
            callback(users);
        });
    });
};

Users.countOfLinkedWith = function(puzzleId, callback) {
    UsersToPuzzles.count({puzzleId: puzzleId}, function(error, count) {
        if(error) {throw error;}
        callback(count);
    });
};

Users.add = function(name, callback) {
    var user = new Users();
    user.name = name;
    user.save(function(error) {
        if(error) {throw error;}
        callback(user);
    });
};

Users.addAnonymous = function(callback) {
    var name = 'anonymous_' + Math.floor(Math.random()* 10000);

    Users.checkName(name, function(available) {
        if (available) {
            Users.add(name, callback);
        } else {
            Users.addAnonymous(callback);
        }
    });
};

Users.checkName = function(name, callback) {
    Users.findOne({name: name}, function(error, user) {
        if (error) { throw error; }
        callback(_.isNull(user) ? true : false);
    });
};

Users.get = function(id, callback) {
	try {
    	Users.findById(id, function(error, user) {
	        if(error) {throw error;}
	        callback(user);
	    });
	} catch (error) {
		callback(null);
	}
};

Users.prototype.setName = function(name, callback) {
    this.name = name;
    this.save(function(error) {
        if(error) {throw error;}
        callback();
    });
};

Users.prototype.addScore = function(score, callback) {
    this.score += score;
    this.save(function(error) {
        if(error) {throw error;}
        callback();
    });
};

Users.prototype.addPuzzleScore = function(score, puzzleId, callback) {
    var query = new Query();
    var userId = this._id;
    query.where('userId', userId);
    query.where('puzzleId', puzzleId);
    UsersToPuzzles.findOne(query, function(error, link) {
        if(error) {throw error;}

        if(_.isNull(link)) {
            var link = new UsersToPuzzles();
            link.userId = userId;
            link.puzzleId = puzzleId;
        }
        
        link.score += score;
        link.save(function(error) {
            if(error) {throw error;}
            callback();
        });
    });
};

Users.prototype.getPuzzleData = function(puzzleId, callback) {
    var self = this;
    var query = new Query();
    query.where('userId', this._id);
    query.where('puzzleId', puzzleId);
    UsersToPuzzles.findOne(query, function(error, link) {
        if(error) {throw error;}

        var result = {score: 0, swaps: 0, found: 0};
        
        if(!_.isNull(link)) {
            result.score = link.toObject().score;
            result.swaps = link.toObject().swapsCount;
            result.found = link.toObject().foundCount;
        }
        
        callback(result, self._id);
    });
};

Users.prototype.isLinkedWith = function(puzzleId, callback) {
    var query = new Query();
    query.where('userId', this._id);
    query.where('puzzleId', puzzleId);
    UsersToPuzzles.findOne(query, function(error, doc) {
        if(error) {throw error;}
        callback(_.isNull(doc) ? false : true);
    });
};

Users.prototype.addSwap = function(puzzleId, callback) {
    var query = new Query();
    var userId = this._id;
    query.where('userId', userId);
    query.where('puzzleId', puzzleId);

    UsersToPuzzles.findOne(query, function(error, link) {
        if(error) {throw error;}

        if(_.isNull(link)) {
            var link = new UsersToPuzzles();
            link.userId = userId;
            link.puzzleId = puzzleId;
        }

        link.swapsCount += 1;
        link.save(function(error) {
            if(error) {throw error;}
            if(callback) {callback();}
        });
    });
};

Users.prototype.addFoundPieces = function(number, puzzleId, callback) {
    var query = new Query();
    var userId = this._id;
    query.where('userId', userId);
    query.where('puzzleId', puzzleId);
    UsersToPuzzles.findOne(query, function(error, link) {
        if(error) {throw error;}

        if(_.isNull(link)) {
            var link = new UsersToPuzzles();
            link.userId = userId;
            link.puzzleId = puzzleId;
        }
        
        link.foundCount += number;
        link.save(function(error) {
            if(error) {throw error;}
            if(callback) {callback();}
        });
    });
};

module.exports = Users;