(function() {

function Dialog() {
    this.shown = false;
    this.observer = Utils.Observer();
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
    var top = Math.floor($(window).height() / 2 - this.element.height() / 2);
    var left = Math.floor($(window).width() / 2 - this.element.width() / 2);

    this.element.css('top', -this.element.height());
    this.element.css('left', left);
    this.element.show();

    this.element.animate({top: top}, 100, _.bind(function() {
        this.shown = true;
        this.observer.fire('shown');
    }, this));
};

Dialog.prototype.shake = function() {
    for(var i = 0, offset = 10; i < 6; i++, offset = -offset) {
        this.element.animate({marginLeft: offset}, 100);
    }
    this.element.animate({marginLeft: 0}, 100);
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

function UserNameDialog() {
    UserNameDialog.superproto.constructor.call(this);

    this.events = UserNameDialog.EVENTS;
    this.input = $('<input type="text" class="inputText" />');
    this.element.append('<div class="title">Your name:</div>')
                .append(this.input);
    
    this.input.keypress(_.bind(function(event) {
        if(event.which != 13) {return;}
        
        var newName = this.input.val();
        if(newName.length) {
            this.observer.fire('entered', newName);
            this.hide();
        } else {
            this.shake();
        }
    }, this));
}

inherit(UserNameDialog, Dialog);

UserNameDialog.EVENTS = {
    entered: 'entered'
};

UserNameDialog.prototype.show = function() {
    UserNameDialog.superproto.show.call(this);
    this.input.focus();
}

function MenuDialog() {
    MenuDialog.superproto.constructor.call(this);
    
    this.element.append($('#menu').html());

    this.leadersPage = this.element.find('.leaders');
    this.leadersPage.viewport({position: 'top'});
    this.leadersPage.viewport('content').scraggable({axis: 'y', containment: 'parent'});
    this.leadersPage.scrolla({content: this.leadersPage.viewport('content')});

    this.puzzlesPage = this.element.find('.puzzles');
    this.puzzlesPage.viewport();
    this.puzzlesPage.viewport('content').scraggable({axis: 'y', containment: 'parent'});
    this.puzzlesPage.scrolla({content: this.puzzlesPage.viewport('content')});

    this.creditsPage = this.element.find('.credits');
    this.creditsPage.viewport();
    this.creditsPage.viewport('content').scraggable({axis: 'y', containment: 'parent'});
    this.creditsPage.scrolla({content: this.creditsPage.viewport('content')});
    
    var tabs = this.element.find('.tabs li');

    tabs.click(_.bind(function(e) {
        tabs.removeClass('sel');
        var tab = $(e.target).addClass('sel').data('page');
        this.element.find('.page').hide();
        this.element.find('.page.'+tab).show();
    }, this));

    tabs.eq(1).click(_.bind(function() {
        this.leadersPage.viewport('update');
        this.leadersPage.scrolla('update');
    }, this));

    tabs.eq(2).click(_.bind(function() {
        this.puzzlesPage.viewport('update');
        this.puzzlesPage.scrolla('update');
    }, this));

    tabs.eq(3).click(_.bind(function() {
        this.creditsPage.viewport('update');
        this.creditsPage.scrolla('update');
    }, this));
}

inherit(MenuDialog, Dialog);

MenuDialog.prototype.updateTopTwenty = function(users) {
    var list = this.leadersPage.find('ul');
    for(var num = 1, i = users.length; i > 0; num++, i--) {
        var user = users[i-1];
        var row = '<li>' +
            '<span class="num">' + num + '.</span>' +
            '<span class="name">' + user.name + '</span>' +
            '<span class="time">' + TimeHelper.diffString(user.created) + '</span>' +
            '<span class="score">' + user.score + '</span>' +
        '</li>';

        list.append(row);
    }
};

Puzzle.Dialog = Dialog;
Puzzle.UserNameDialog = UserNameDialog;
Puzzle.MenuDialog = new MenuDialog();

function inherit(child, parent) {
    function F() {}
    F.prototype = parent.prototype;
    child.prototype = new F();
    child.prototype.constructor = child;
    child.superproto = parent.prototype;
    return child;
}

var TimeHelper = {
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
    }
};

})();