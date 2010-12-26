Puzzle.Panel = function(element) {
    var events = Puzzle.Panel.events;
    var observer = Utils.Observer();
    observer.register(events.userNameChanged);

    var height = element.height();
    var initTop = (height - 30) * -1;
    var initRight = -30;
    element.css('top', initTop);
    element.css('right', initRight);
    element.show();

    element.click(function() {
        element.animate({
            right: 0,
            top: 0
        }, 200, function() {
            element.removeClass('clickable');
        });
    });
    
    element.mouseleave(function() {
        element.animate({
            right: initRight,
            top: initTop
        }, 200, function() {
            element.addClass('clickable');
        });
    });

    var userNameDialog = Puzzle.userNameDialog();
    var userNameElement = element.find('.user .name');

    userNameElement.click(function(event) {
        userNameDialog.show();
        event.stopPropagation();
    });

    userNameDialog.subscribe(Puzzle.userNameDialog.events.entered, function(value) {
        setUsername(value);
        observer.userNameChanged(value);
    });

    function setUsername(name) {
        userNameElement.text(name);
    }

    function setScore(score) {
        element.find('.user .num').text(score);
    }

    return {
        subscribe: observer.subscribe,
        setUsername: setUsername,
        setScore: setScore
    }
};

Puzzle.Panel.events = {
    userNameChanged: 'userNameChanged'
};