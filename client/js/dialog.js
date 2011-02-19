Puzzle.Dialog = function(content) {
    var events = Puzzle.Dialog.events;
    var observer = Utils.Observer();
    
    var element = $('<div class="dialog"></div>');
    var close = $('<span class="close">close</span>');
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
               .css('left', toInt(windowWidth/2) - toInt(elementWidth/2))
               .show();

        element.animate({
            top: toInt(windowHeight/2) - toInt(element.height()/2)
        }, 100, function() {
            shown = true;
            observer.fire('shown');
        });
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
        get shown() {
            return shown;
        },
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