Puzzle.Dialog = function(content) {
    var events = Puzzle.Dialog.events;
    var observer = Utils.Observer();
    
    var element = $('<div class="dialog"></div>');
    var close = $('<span class="button close">close</span>');
    element.append(close)
           .append(content)
           .appendTo(document.body);

    var elementHeight = $(element).height();
    var elementWidth = $(element).width();
    var shown = false;
    close.click(hide);

    function show() {
        var windowHeight = $(window).height();
        var windowWidth = $(window).width();
        
        element.css('top', elementHeight * -1)
               .css('left', Math.floor(windowWidth/2) - Math.floor(elementWidth/2))
               .show();

        element.animate({
            top: Math.floor(windowHeight/2) - Math.floor(element.height()/2)
        }, 100, function() {
            shown = true;
            observer.fire('shown');
        });
    }

    function isShown() {
        return shown;
    }

    function shake() {
        element.animate({marginLeft: -10}, 100)
               .animate({marginLeft:  10}, 100)
               .animate({marginLeft: -10}, 100)
               .animate({marginLeft:  10}, 100)
               .animate({marginLeft: -10}, 100)
               .animate({marginLeft:  10}, 100)
               .animate({marginLeft: 0}, 100);
    }

    function hide() {
        element.animate({
            top: elementHeight * -1
        }, 100, function() {
            element.hide();
            shown = false;
            observer.fire('hidden');
        });
    }

    return {
        show: show,
        hide: hide,
        shake: shake,
        shown: isShown,
        subscribe: observer.subscribe
    };
};

Puzzle.Dialog.events = {
    shown: 'shown',
    hidden: 'hidden'
};

Puzzle.UserNameDialog = function() {
    var events = Puzzle.UserNameDialog.events;
    var observer = Utils.Observer();

    var element = $('<div></div>');
    var input = $('<input type="text" class="inputText" />');
    element.append('<div class="title">Your name:</div>')
           .append(input);

    var dialog = Puzzle.Dialog(element);
    dialog.subscribe(Puzzle.Dialog.events.shown, function() {
        input.focus();
    });

    input.keypress(function(event) {
        if(event.which == 13) {
            var newName = input.val();
            if(newName.length) {
                observer.fire('entered', newName);
                dialog.hide();
            } else {
                dialog.shake();
            }
        }
    });

    dialog.subscribe = observer.subscribe;
    
    return dialog;
};

Puzzle.UserNameDialog.events = {
    entered: 'entered'
};

Puzzle.MenuDialog = (function() {
    var element = $('#menu');
    var leadersBoard = $('.leadersBoard', element);
    var dialog = Puzzle.Dialog(element);

    var MONTH = 60*60*24*30;
    var DAY = 60*60*24;
    var HOUR = 60*60;
    var MINUTE = 60;

    function getMonthes(time) {
        return Math.floor(time / MONTH);
    }
    function getDays(time) {
        return Math.floor(time / DAY);
    }
    function getHours(time) {
        return Math.floor(time / HOUR);
    }
    function getMinutes(time) {
        return Math.floor(time / MINUTE);
    }

    function getTimeString(creationTime) {
        var creationDate = new Date(creationTime);
        var diff = Math.floor((new Date() - creationDate.getTime()) / 1000);
        var monthes, days, hours, minutes;
        var result = '';

        if (diff >= MONTH) {
            monthes = getMonthes(diff);
            days = getDays(diff % MONTH);
            hours = getHours(diff % (MONTH*DAY));

            result += monthes + (monthes > 1 ? ' monthes, ' : ' month, ');
            result += days + (days > 1 ? ' days and ' : ' day and ');
            result += hours + (hours > 1 ? ' hours' : ' hour');
        } else if (diff >= DAY) {
            days = getDays(diff);
            hours = getHours(diff % DAY);
            minutes = getMinutes(diff % (DAY*HOUR));

            result += days + (days > 1 ? ' days, ' : ' day, ');
            result += hours + (hours > 1 ? ' hours and ' : ' hour and ');
            result += minutes + (minutes > 1 ? ' minutes' : ' minute');
        } else if (diff >= HOUR) {
            hours = getHours(diff);
            minutes = getMinutes(diff % HOUR);

            result += hours + (hours > 1 ? ' hours and ' : ' hour and ');
            result += minutes + (minutes > 1 ? ' minutes' : ' minute');
        } else if (diff >= MINUTE) {
            minutes = getMinutes(diff % HOUR);

            result += minutes + (minutes > 1 ? ' minutes' : ' minute');
        } else {
            result += 'just now';
        }
        
        return result;
    }

    dialog.updateLeadersBoard = function(users) {
        var number = 1;
        for(var i = users.length; i > 0; i--) {
            var row = '<li>' +
                '<span class="num">' + number++ + '.</span>' +
                '<span class="name">' + users[i-1].name + '</span>' +
                '<span class="time">' + getTimeString(users[i-1].created) + '</span>' +
                '<span class="score">' + users[i-1].score + '</span>' +
            '</li>';
            getTimeString(users[i-1].created);
            leadersBoard.append(row);
        };
    };
    
    return dialog;
})();