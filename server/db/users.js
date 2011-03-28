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

Users.add = function(name, callback) {
    var user = new Users();
    user.name = name;
    user.save(function(error) {
        if(error) {throw error;}
        callback(user);
    });
};

Users.get = function(id, callback) {
    Users.findById(id, function(error, user) {
        if(error) {throw error;}
        callback(user);
    });
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
    query.where('userId', this._id);
    query.where('puzzleId', puzzleId);
    UsersToPuzzles.findOne(query, function(error, link) {
        if(error) {throw error;}
        if(_.isNull(link)) {
            link = new UsersToPuzzles();
            link.userId = this._id;
            link.puzzleId = puzzleId;
        }

        link.score += score;
        link.save(function(error) {
            if(error) {throw error;}
            callback();
        });
    });
};

Users.prototype.getPuzzleScore = function(puzzleId, callback) {
    var self = this;
    var query = new Query();
    query.where('userId', this._id);
    query.where('puzzleId', puzzleId);
    UsersToPuzzles.findOne(query, function(error, link) {
        if(error) {throw error;}

        var score = 0;
        if(!_.isNull(link)) {
            score = link.toObject().score;
        }
        callback(score, self._id);
    });
};

Users.prototype.linkWith = function(puzzleId, callback) {
    var link = new UsersToPuzzles();
    link.userId = this._id;
    link.puzzleId = puzzleId;
    link.save(function(error) {
        if(error) {throw error;}
        if(!_.isUndefined(callback) &&
            _.isFunction(callback)) {
            callback();
        }
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

module.exports = Users;