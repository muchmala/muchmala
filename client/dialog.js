Puzzle.dialog = function(content) {
    var element = $('<div class="dialog"></div>');
    var close = $('<span class="close">close</span>');
    element.append(close)
           .append(content)
           .appendTo(document.body);

    var elementHeight = $(element).height();
    var elementWidth = $(element).width();

    close.click(hide);

    function show() {
        var windowHeight = $(window).height();
        var windowWidth = $(window).width();
        
        element.css('top', elementHeight * -1)
               .css('left', toInt(windowWidth/2) - toInt(elementWidth/2))
               .show();

        element.animate({
            top: toInt(windowHeight/2) - toInt(element.height()/2)
        }, 100);
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
        });
    }

    return {
        show: show,
        hide: hide,
        shake: shake
    }
};

Puzzle.userNameDialog = function() {
    var events = Puzzle.userNameDialog.events;
    var observer = Utils.Observer();
    observer.register(events.entered);

    var element = $('<div></div>');
    var input = $('<input type="text" class="inputText" />');
    element.append('<div class="title">Your name:</div>')
           .append(input);

    var dialog = Puzzle.dialog(element);

    input.keypress(function(event) {
        if(event.which == 13) {
            var newName = input.val();
            if(newName.length) {
                observer.entered(newName);
                dialog.hide();
            } else {
                dialog.shake();
            }
        }
    });

    return {
        show: function() {
            dialog.show();
            input.focus();
        },
        hide: dialog.hide,
        subscribe: observer.subscribe
    }
};

Puzzle.userNameDialog.events = {
    entered: 'entered'
};