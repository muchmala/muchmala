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

    function updateLeadersBoard(usersData) {
        if(usersData.length == 0) { return; }

        var leadersBoard = element.find('.leadersboard .borders').empty();
        
        for(var i = usersData.length; i > 0; i--) {
            var row = $('<div class="row"></div>')
            var status = 'offline';
            if(usersData[i-1].online) {
                status = 'online';
            }
            row.append('<span class="status ' + status + '"></span>');
            row.append('<span class="name">' + usersData[i-1].name + '</span>');
            row.append('<span class="num">' + usersData[i-1].score + '</span>');
            row.appendTo(leadersBoard);
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
        events: panel.EVENTS,
        show: show
    }
};

Puzzle.Panel.EVENTS = {
    userNameChanged: 'userNameChanged'
};