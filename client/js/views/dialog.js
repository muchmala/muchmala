(function() {

function Dialog() {
    Dialog.superproto.constructor.call(this);
    
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

Puzz.Utils.inherit(Dialog, Puzz.Observer);

Dialog.EVENTS = {
    shown: 'shown',
    hidden: 'hidden'
};

Dialog.prototype.show = function() {
	this.element.css('margin-top', -Math.floor(this.element.outerHeight() / 2))
	this.element.css('margin-left', -Math.floor(this.element.outerWidth() / 2))
    this.element.css('left', '50%').show();

    this.element.animate({top: '50%'}, 100, _.bind(function() {
        this.shown = true;
        this.fire('shown');
    }, this));
    
    return this;
};

Dialog.prototype.shake = function() {
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

Dialog.prototype.hide = function() {
    var top = -this.element.height();
    this.element.animate({top: top}, 100, _.bind(function() {
        this.shown = false;
        this.element.hide();
        this.fire('hidden');
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

        var newName = this.input.val();
        
        if(/^[A-Za-z0-9_]{3,20}$/.test(newName) ) {
            model.set('name', newName).save('name');
            this.element.find('.error').hide();
            this.element.addClass('loading');
        } else {
            this.shake();
        }
    }, this));

    this.model.on('saved:name', _.bind(function() {
        this.element.removeClass('loading');
        this.hide();
    }, this));
    
    this.model.on('error:saving:name', _.bind(function(reason) {
        console.log(2);
        this.element.find('.error.' + reason).show();
        this.element.removeClass('loading');
    }, this));
}

Puzz.Utils.inherit(UserNameDialog, Dialog);

UserNameDialog.prototype.show = function() {
    UserNameDialog.superproto.show.call(this);
    this.input.val(this.model.get('name'));
    this.input.focus();
};

UserNameDialog.prototype.hide = function() {
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

    if (!Puzz.Storage.menu.isHowToPlayShown()) {
        self.tabs.howtoplay.addClass('highlight');
    }

    this.tabs.howtoplay.click(function() {
        Puzz.Storage.menu.setHowToPlayShown();
        $(this).removeClass('highlight');
    });
    
    this.tabs.leaders.click(function() {
        self.pages.leaders.addClass('loading');
        self.twenty.fetch();
    });

    this.twenty.on('change:list', function() {
        self.updateTopTwenty();
        self.pages.leaders.viewport('update');
        self.pages.leaders.scrolla('update');
        self.pages.leaders.removeClass('loading');
    });
}

Puzz.Utils.inherit(MenuDialog, Dialog);

MenuDialog.prototype.openPage = function(pageName) {
    _.each(this.tabs, function(tab) {tab.removeClass('sel');});
    _.each(this.pages, function(page) {page.hide();});

    this.tabs[pageName].addClass('sel');
    this.pages[pageName].show();

    Puzz.Storage.menu.lastViewedPage(pageName)
};

MenuDialog.prototype.loading = function(percent) {
    this.element.find('.welcome .button.big i').css('width', percent + '%');
};

MenuDialog.prototype.loadingComplete = function() {
    this.element.find('.welcome .button.big').html('Start Playing');
    this.element.find('.welcome .button.big').removeClass('loading');
    this.element.find('.welcome .button.big').click(_.bind(function() {
        this.hide();
    }, this));
};

MenuDialog.prototype.updateTopTwenty = function() {
    var list = this.pages.leaders.find('ul').empty();
    var users = this.twenty.get('list');
    
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

    this.puzzle.on('change', function() {
        if (_.isUndefined(self.puzzle.get('completed'))) {return;}
        
        var data = self.puzzle.all();
        var creationTime = +(new Date(data.created));
        var completionTime = +(new Date(data.completed));
        var timeSpent = Puzz.TimeHelper.diffHoursMinutes(creationTime, completionTime);
        
        self.element.find('.pieces .value').html(data.vLength * data.hLength);
        self.element.find('.participants .value').html(data.participants);
        self.element.find('.timespent .value').html(timeSpent);
        self.element.find('.swaps .value').html(data.swaps);
    });

    this.leaders.on('change:list', function() {
        self.updateLeadersBoard();
    });
}

Puzz.Utils.inherit(CompleteDialog, Dialog);

CompleteDialog.prototype.hide = function() {
    CompleteDialog.superproto.hide.call(this);
	this.closed = true;
};

CompleteDialog.prototype.updateLeadersBoard = function() {
    var leadersBoard = this.element.find('.leaders').empty();
    var leadersData = this.leaders.getListSortedBy(this.leadersShow);

    for(var i = leadersData.length, num = 1; i > 0 && num < 6; i--) {
        var row = $('<li></li>');
        var data = leadersData[i-1];

        row.append('<span class="num">' + (num++) + '.</span>');
        row.append('<span class="name">' + data.name + '</span>');
        row.append('<span class="dots"></span>');
        row.append('<span class="score">' + data[this.leadersShow] + '</span>');
        row.appendTo(leadersBoard);
    }
};

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

})();