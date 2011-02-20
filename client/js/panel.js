Puzzle.Panel = function panel(element) {
    var observer = Utils.Observer();

    $('.expcol', element).click(function() {
        if($('.expcol', element).hasClass('opened')) {
            $('.logo', element).hide();
            $('.statistics', element).hide();
            $('.leadersboard', element).hide();
            $('.expcol', element).removeClass('opened');
        } else {
            $('.logo', element).show();
            $('.statistics', element).show();
            $('.leadersboard', element).show();
            $('.expcol', element).addClass('opened');
        }
    });

    var userNameDialog = Puzzle.UserNameDialog();
    var userNameElement = element.find('.user .name');

    userNameElement.click(function(event) {
        if(!userNameDialog.shown) {
            userNameDialog.show();
        }
    });

    userNameDialog.subscribe(Puzzle.UserNameDialog.events.entered, function(value) {
        observer.fire(panel.EVENTS.userNameChanged, value);
    });

    function setUsername(name) {
        userNameElement.text(name);
    }

    function setScore(score) {
        element.find('.user .num').text(score);
    }

    function setConnectedUsersCount(count) {
        element.find('.statistics .connected').text(count);
    }

    function setCompleteLevel(percent) {
        element.find('.statistics .complete').text(percent+'%');
    }

    function setTimeSpent(createdAtTime) {
        var creationDate = new Date(createdAtTime);
        updateTimeSpent(creationDate);

        setInterval(function() {
            updateTimeSpent(creationDate);
        }, 60000);
    }

    function updateTimeSpent(createdAtTime) {
        var diff = parseInt((new Date() - createdAtTime) / 1000);
        var hours = parseInt(diff / 3600);
        var minutes = parseInt((diff % 3600) / 60);

        if((hours+'').length == 1) {
            hours = '0' + hours;
        }

        if((minutes+'').length == 1) {
            minutes = '0' + minutes;
        }

        element.find('.statistics .timeSpent').text(hours + ':' + minutes);
    }

    function updateLeadersBoard(users) {
        var leadersBoard = element.find('.leadersboard .borders');
        leadersBoard.empty();
        for(var i = 0, len = users.length; i < len; i++) {
            leadersBoard.append('<span class="name">' + users[i].name + '</span>');
            leadersBoard.append('<span class="num">' + users[i].curMapScore +
                                '<span class="pts">pts.</span></span><br/>');
        }
    }

    function show() {
        element.show();
    }

    return {
        subscribe: observer.subscribe,
        updateLeadersBoard: updateLeadersBoard,
        setConnectedUsersCount: setConnectedUsersCount,
        setCompleteLevel: setCompleteLevel,
        setUsername: setUsername,
        setTimeSpent: setTimeSpent,
        setScore: setScore,
        show: show
    }
};

Puzzle.Panel.EVENTS = {
    userNameChanged: 'userNameChanged'
};