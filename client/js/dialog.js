window.Puzz = (function(ns) {

function Dialog() {
    this.shown = false;
    this.shaking = false;
    this.observer = ns.Observer();
    this.close = $('<span class="button close">x</span>');

    this.element = $('<div class="dialog"></div>');
    this.element.appendTo(document.body);
    this.element.append(this.close);

    this.close.click(_.bind(function() {
        this.hide();
    }, this));
}

Dialog.EVENTS = {
    shown: 'shown',
    hidden: 'hidden'
};

Dialog.prototype.show = function() {
    var top = Math.floor($(window).height() / 2 - this.element.outerHeight() / 2);
    var left = Math.floor($(window).width() / 2 - this.element.outerWidth() / 2);

    this.element.css('top', -this.element.height());
    this.element.css('left', left);
    this.element.show();

    this.element.animate({top: top}, 100, _.bind(function() {
        this.shown = true;
        this.observer.fire('shown');
    }, this));
};

Dialog.prototype.shake = function() {
    if (this.shaking) {return;}

    this.shaking = true;
    for(var i = 0, offset = 5; i < 6; i++, offset = -offset) {
        this.element.animate({marginLeft: offset}, 50);
    }
    this.element.animate({marginLeft: 0}, 50, null, _.bind(function() {
        this.shaking = false;
    }, this));
};

Dialog.prototype.hide = function() {
    var top = -this.element.height();
    this.element.animate({top: top}, 100, _.bind(function() {
        this.shown = false;
        this.element.hide();
        this.observer.fire('hidden');
    }, this));
};

Dialog.prototype.on = function(eventName, callback) {
    this.observer.subscribe(eventName, callback);
}

function UserNameDialog(server) {
    UserNameDialog.superproto.constructor.call(this);

    this.events = UserNameDialog.EVENTS;
    this.element.append($('#username').show());
    this.input = this.element.find('input');
    this.userName = this.input.val();

    var KEYCODE_ENTER = 13;
    var KEYCODE_ESC = 27;
    
    this.input.keyup(_.bind(function(event) {
        if (event.keyCode == KEYCODE_ESC) {this.hide();return;}
        if (event.keyCode != KEYCODE_ENTER) {return;}

        var newName = this.input.val();
        
        if(/^[A-Za-z0-9_]{3,20}$/.test(newName) ) {
            server.setUserName(newName);
            this.element.addClass('loading');
            this.element.find('.error').hide();
        } else {
            this.shake();
        }
    }, this));

    server.on(MESSAGES.setUserName, _.bind(function(data) {
        this.element.removeClass('loading');

        if (!_.isUndefined(data) && !_.isUndefined(data.error)) {
            this.element.find('.error.' + data.error).show();
        } else {
            this.hide();
        }
    }, this));

    server.on(MESSAGES.userData, _.bind(function(data) {
        this.userName = data.name;
    }, this));
}

inherit(UserNameDialog, Dialog);

UserNameDialog.prototype.show = function() {
    UserNameDialog.superproto.show.call(this);
    this.input.val(this.userName);
    this.input.focus();
};

UserNameDialog.prototype.hide = function() {
    UserNameDialog.superproto.hide.call(this);
    this.input.blur();
};

function MenuDialog(server) {
    MenuDialog.superproto.constructor.call(this);
    this.element.append($('#menu').show());
    this.server = server;
    
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

    if (!ns.Storage.menu.isHowToPlayShown()) {
        self.tabs.howtoplay.addClass('highlight');
    }

    self.tabs.howtoplay.click(function() {
        ns.Storage.menu.setHowToPlayShown();
        $(this).removeClass('highlight');
    });

    this.server.on(MESSAGES.initialized, function() {
        self.requestPuzzles();
        self.requestTopTwenty();
        self.tabs.leaders.click(function() {self.requestTopTwenty();});
        //self.tabs.puzzles.click(function() {self.requestPuzzles();});
    });

    this.server.on(MESSAGES.topTwenty, function(data) {
        self.updateTopTwenty(data);
        self.pages.leaders.viewport('update');
        self.pages.leaders.scrolla('update');
        self.pages.leaders.removeClass('loading');
    });
}

inherit(MenuDialog, Dialog);

MenuDialog.prototype.openPage = function(pageName) {
    _.each(this.tabs, function(tab) {tab.removeClass('sel');});
    _.each(this.pages, function(page) {page.hide();});

    this.tabs[pageName].addClass('sel');
    this.pages[pageName].show();

    ns.Storage.menu.lastViewedPage(pageName)
};

MenuDialog.prototype.loaded = function(percent) {
    this.element.find('.welcome .button.big i').css('width', percent + '%');
};

MenuDialog.prototype.loadingComplete = function() {
    this.element.find('.welcome .button.big').html('Start Playing');
    this.element.find('.welcome .button.big').removeClass('loading');
    this.element.find('.welcome .button.big').click(_.bind(function() {
        this.hide();
    }, this));
};

MenuDialog.prototype.updateTopTwenty = function(users) {
    var list = this.pages.leaders.find('ul').empty();
    for(var i = 0; i < users.length; i++) {
        var user = users[i];
        var row = '<li>' +
            '<span class="num">' + (i + 1) + '.</span>' +
            '<span class="name">' + user.name + '</span>' +
            '<span class="time">' + ns.TimeHelper.diffString(user.created) + '</span>' +
            '<span class="score">' + user.score + '</span>' +
        '</li>';

        list.append(row);
    }
};

MenuDialog.prototype.requestTopTwenty = function() {
    this.server.getTopTwenty();
    this.pages.leaders.addClass('loading');
};

MenuDialog.prototype.requestPuzzles = function() {
    // TODO: implement
};

MenuDialog.prototype.show = function() {
    MenuDialog.superproto.show.call(this);

    var lastViewed = ns.Storage.menu.lastViewedPage();
    if (lastViewed) {this.openPage(lastViewed);}
    // TODO: Refactor this
    if (lastViewed == 'leaders') {
        this.pages.leaders.viewport('update');
        this.pages.leaders.scrolla('update');
    }
    return this;
}

MenuDialog.prototype.hide = function() {
    MenuDialog.superproto.hide.call(this);
    return this;
};

function CompleteDialog(server) {
    CompleteDialog.superproto.constructor.call(this);
    this.element.append($('#complete').show());

    this.leadersData = null;
    this.leadersShow = 'score';

    var self = this;

    this.element.find('.button.sort').click(function() {
        if (self.leadersShow == 'score') {
            self.leadersShow = 'found';
        } else if (self.leadersShow == 'found') {
            self.leadersShow = 'score';
        }
        $(this).html('by ' + self.leadersShow);
        self.updateLeadersBoard();
    });

    this.element.find('.button.big').click(function() {
        window.location.href = '/';
    });

    server.on(MESSAGES.puzzleData, function(data) {
        if (_.isUndefined(data.completed)) {return;}

        var creationTime = +(new Date(data.created));
        var completionTime = +(new Date(data.completed));
        var timeSpent = ns.TimeHelper.diffHoursMinutes(creationTime, completionTime);
        self.element.find('.pieces .value').html(data.vLength * data.hLength);
        self.element.find('.participants .value').html(data.participants);
        self.element.find('.timespent .value').html(timeSpent);
        self.element.find('.swaps .value').html(data.swaps);
    });

    server.on(MESSAGES.leadersBoard, function(data) {
        self.leadersData = data;
        self.updateLeadersBoard();
    });
}

inherit(CompleteDialog, Dialog);

CompleteDialog.prototype.show = function() {
    CompleteDialog.superproto.show.call(this);
}

CompleteDialog.prototype.updateLeadersBoard = function() {
    var leadersBoard = this.element.find('.leaders').empty();

    this.leadersData = _.sortBy(this.leadersData, _.bind(function(row) {
        return row[this.leadersShow];
    }, this));

    for(var i = this.leadersData.length, num = 1; i > 0 && num < 6; i--) {
        var row = $('<li></li>');
        var data = this.leadersData[i-1];

        row.append('<span class="num">' + (num++) + '.</span>');
        row.append('<span class="name">' + data.name + '</span>');
        row.append('<span class="dots"></span>');
        row.append('<span class="score">' + data[this.leadersShow] + '</span>');
        row.appendTo(leadersBoard);
    }
};

function inherit(child, parent) {
    function F() {}
    F.prototype = parent.prototype;
    child.prototype = new F();
    child.prototype.constructor = child;
    child.superproto = parent.prototype;
    return child;
}

ns.TimeHelper = {
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

ns.Dialog = Dialog;
ns.UserNameDialog = UserNameDialog;
ns.MenuDialog = MenuDialog;
ns.CompleteDialog = CompleteDialog;

return ns;

})(window.Puzz || {});