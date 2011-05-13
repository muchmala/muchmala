(function() {

function Dialog() {
    this.shown = false;
    this.shaking = false;
    this.close = $('<span class="button close">x</span>');

    this.element = $('<div class="dialog"></div>');
    this.element.appendTo(document.body);
    this.element.append(this.close);

    this.close.click(_.bind(function() {
        this.hide();
    }, this));
}

_.extend(Dialog.prototype, Backbone.Events);

Dialog.EVENTS = {
    shown: 'shown',
    hidden: 'hidden'
};

var DialogProto = Dialog.prototype;

DialogProto.show = function() {
	this.element.css('margin-top', -Math.floor(this.element.outerHeight() / 2));
	this.element.css('margin-left', -Math.floor(this.element.outerWidth() / 2));
    this.element.css('left', '50%').show();

    this.element.animate({top: '50%'}, 100, _.bind(function() {
        this.shown = true;
        this.trigger('shown');
    }, this));
    
    return this;
};

DialogProto.shake = function() {
    if (this.shaking) {return;}
    
    this.shaking = true;
    var marginLeft = parseInt(this.element.css('margin-left'));
    for(var i = 0, offset = 5; i < 6; i++, offset = -offset) {
        this.element.animate({marginLeft: marginLeft + offset}, 50);
    }
    this.element.animate({marginLeft: marginLeft}, 50, null, _.bind(function() {
        this.shaking = false;
    }, this));
    
    return this;
};

DialogProto.hide = function() {
    var top = -this.element.height();
    this.element.animate({top: top}, 100, _.bind(function() {
        this.shown = false;
        this.element.hide();
        this.trigger('hidden');
    }, this));
    
    return this;
};

function UserNameDialog(model) {
    UserNameDialog.superproto.constructor.call(this);

    this.events = UserNameDialog.EVENTS;
    this.element.append($('#username').show());
    this.input = this.element.find('input');
    this.model = model;

    var KEYCODE_ENTER = 13;
    var KEYCODE_ESC = 27;
    
    this.input.keyup(_.bind(function(event) {
        if (event.keyCode == KEYCODE_ESC) {this.hide();return;}
        if (event.keyCode != KEYCODE_ENTER) {return;}

        this.element.find('.error').hide();
        this.element.addClass('loading');
        
        model.save({'name': this.input.val()}, {silent: true});
    }, this));

    this.model.bind('saved', _.bind(function() {
        this.element.removeClass('loading');
        this.hide();
    }, this));
    
    this.model.bind('error', _.bind(function(model, error) {
        this.element.find('.error.' + error).show();
        this.element.removeClass('loading');
        this.shake();
    }, this));
}

Puzz.Utils.inherit(UserNameDialog, Dialog);

var UserNameDialogProto = UserNameDialog.prototype;

UserNameDialogProto.show = function() {
    UserNameDialog.superproto.show.call(this);
    this.input.val(this.model.get('name'));
    this.input.focus();
};

UserNameDialogProto.hide = function() {
    UserNameDialog.superproto.hide.call(this);
    this.input.blur();
};

function MenuDialog(twenty) {
    MenuDialog.superproto.constructor.call(this);
    this.element.append($('#menu').show());
    this.twenty = twenty;
    
    this.tabs = {};
    this.pages = {};

    var self = this;

    this.element.find('.tabs li').each(function() {self.tabs[$(this).data('page')] = $(this);});
    this.element.find('.page').each(function() {self.pages[$(this).data('name')] = $(this);});

    _.each(this.tabs, function(tab) {
        tab.click(function() {
            self.openPage(tab.data('page'));
        });
    });

    this.element.find('p .button').click(function() {
        self.openPage('howtoplay');
    });

    this.pages.leaders.viewport({position: 'top'});
    this.pages.leaders.viewport('content').scraggable({axis: 'y', containment: 'parent'});
    this.pages.leaders.scrolla({content: this.pages.leaders.viewport('content')});
    
    this.tabs.leaders.click(function() {
        self.pages.leaders.addClass('loading');
        self.twenty.fetch();
    });

    this.twenty.bind('refresh', function() {
        self.updateTopTwenty();
        self.pages.leaders.viewport('update');
        self.pages.leaders.scrolla('update');
        self.pages.leaders.removeClass('loading');
    });
}

Puzz.Utils.inherit(MenuDialog, Dialog);

var MenuDialogProto = MenuDialog.prototype;

MenuDialogProto.openPage = function(pageName) {
    _.each(this.tabs, function(tab) {tab.removeClass('sel');});
    _.each(this.pages, function(page) {page.hide();});

    this.tabs[pageName].addClass('sel');
    this.pages[pageName].show();
};

MenuDialogProto.updateTopTwenty = function() {
    var list = this.pages.leaders.find('ul').empty();
    var users = this.twenty.toJSON();
    
    for(var i = 0; i < users.length; i++) {
        var user = users[i];
        var row = '<li>' +
            '<span class="num">' + (i + 1) + '.</span>' +
            '<span class="name">' + user.name + '</span>' +
            '<span class="time">' + Puzz.TimeHelper.diffString(user.created) + '</span>' +
            '<span class="score">' + user.score + '</span>' +
        '</li>';

        list.append(row);
    }
};

function CompleteDialog(puzzle, leaders) {
    CompleteDialog.superproto.constructor.call(this);
    this.element.append($('#complete').show());
    this.leaders = leaders;
    this.puzzle = puzzle;

    this.leadersShow = 'score';
	this.closed = false;

    var self = this;

    this.element.find('.button.sort').toggle(
        function() {
            self.leadersShow = 'found';
            self.updateLeadersBoard();
            $(this).html('by ' + self.leadersShow);
        },
        function() {
            self.leadersShow = 'score';
            self.updateLeadersBoard();
            $(this).html('by ' + self.leadersShow);
        });

    this.element.find('.button.big').click(function() {
        window.location.href = '/';
    });

    this.puzzle.bind('change', function() {
        if (_.isUndefined(self.puzzle.get('completed'))) {return;}
        
        var data = self.puzzle.toJSON();
        var creationTime = +(new Date(data.created));
        var completionTime = +(new Date(data.completed));
        var timeSpent = Puzz.TimeHelper.diffHoursMinutes(creationTime, completionTime);
        
        self.element.find('.pieces .value').html(data.vLength * data.hLength);
        self.element.find('.participants .value').html(data.participants);
        self.element.find('.timespent .value').html(timeSpent);
        self.element.find('.swaps .value').html(data.swaps);
    });

    this.leaders.bind('refresh', function() {
        self.updateLeadersBoard();
    });
}

Puzz.Utils.inherit(CompleteDialog, Dialog);

var CompleteDialogProto = CompleteDialog.prototype;

CompleteDialogProto.hide = function() {
    CompleteDialog.superproto.hide.call(this);
	this.closed = true;
};

CompleteDialogProto.updateLeadersBoard = function() {
    var leadersBoard = this.element.find('.leaders').empty();
    var leadersData = this.leaders.getSortedBy(this.leadersShow);

    for(var i = leadersData.length, num = 1; i > 0 && num < 6; i--) {
        var data = leadersData[i-1].toJSON();
        var row = $('<li></li>');

        row.append('<span class="num">' + (num++) + '.</span>');
        row.append('<span class="name">' + data.name + '</span>');
        row.append('<span class="dots"></span>');
        row.append('<span class="score">' + data[this.leadersShow] + '</span>');
        row.appendTo(leadersBoard);
    }
};

function AuthDialog() {
    AuthDialog.superproto.constructor.call(this);
    this.element.append($('#auth').show());
}

Puzz.Utils.inherit(AuthDialog, Dialog);

var AuthDialogProto = AuthDialog.prototype;

Puzz.TimeHelper = {
    MONTH: 60*60*24*30,
    DAY: 60*60*24,
    HOUR: 60*60,
    MINUTE: 60,
    
    getMonthes: function(time) {
        return Math.floor(time / this.MONTH);
    },
    getDays: function(time) {
        return Math.floor(time / this.DAY);
    },
    getHours: function(time) {
        return Math.floor(time / this.HOUR);
    },
    getMinutes: function(time) {
        return Math.floor(time / this.MINUTE);
    },
    diffString: function(creationTime) {
        var creationDate = new Date(creationTime);
        var diff = Math.floor((new Date() - creationDate.getTime()) / 1000);
        var monthes, days, hours, minutes;
        var result = '';

        if (diff >= this.MONTH) {
            monthes = this.getMonthes(diff);
            result = monthes + (monthes > 1 ? ' monthes' : ' month');
        } else if (diff >= this.DAY) {
            days = this.getDays(diff);
            result = days + (days > 1 ? ' days' : ' day');
        } else if (diff >= this.HOUR) {
            hours = this.getHours(diff);
            result = hours + (hours > 1 ? ' hours' : ' hour');
        } else if (diff >= this.MINUTE) {
            minutes = this.getMinutes(diff % this.HOUR);
            result = minutes + (minutes > 1 ? ' minutes' : ' minute');
        } else {
            result = 'just now';
        }

        return result;
    },

    diffHoursMinutes: function(startTime, finishTime) {
        finishTime = finishTime || new Date();
        
        var diff = Math.floor((finishTime - startTime) / 1000);
        var hours = Math.floor(diff / 3600);
        var minutes = Math.floor((diff % 3600) / 60);

        if((hours+'').length == 1) {
            hours = '0' + hours;
        }
        if((minutes+'').length == 1) {
            minutes = '0' + minutes;
        }
        return hours + ':' + minutes;
    }
};

Puzz.Views.MenuDialog = MenuDialog;
Puzz.Views.UserNameDialog = UserNameDialog;
Puzz.Views.CompleteDialog = CompleteDialog;
Puzz.Views.AuthDialog = AuthDialog;

})();