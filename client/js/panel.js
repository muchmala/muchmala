Puzzle.Panel = (function() {
    var element = $('#panel');
    var observer = Utils.Observer();
    var events = {userNameChanged: 'userNameChanged'};

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

    $('.logo h1', element).click(function() {
        Puzzle.MenuDialog.show();
    });

    var userNameDialog = new Puzzle.UserNameDialog();
    var userNameElement = element.find('.user .name');

    userNameElement.click(function(event) {
        if(!userNameDialog.shown) {
            userNameDialog.show();
        }
    });

    userNameDialog.on(Puzzle.UserNameDialog.EVENTS.entered, function(value) {
        observer.fire(events.userNameChanged, value);
    });

    return {
        events: events,
        subscribe: observer.subscribe,
        
        show: function() {
            element.show();
        },
        setUsername: function(name) {
            userNameElement.text(name);
        },
        setScore: function(score) {
            element.find('.user .num').text(score);
        },
        setConnectedUsersCount: function(count) {
            element.find('.statistics .connected').text(count);
        },
        setCompleteLevel: function(percent) {
            element.find('.statistics .complete').text(percent+'%');
        },
        setPiecesNumber: function(number) {
            element.find('.statistics .quantity').text(number);
        },
        setTimeSpent: function(creationTime) {
            var self = this;
            var creationDate = new Date(creationTime);
            self.updateTimeSpent(creationDate.getTime());
            
            setInterval(function() {
                self.updateTimeSpent(creationDate);
            }, 60000);
        },
        updateTimeSpent: function(creationTime) {
            var diff = parseInt((new Date() - creationTime) / 1000);
            var hours = parseInt(diff / 3600);
            var minutes = parseInt((diff % 3600) / 60);

            if((hours+'').length == 1) {
                hours = '0' + hours;
            }

            if((minutes+'').length == 1) {
                minutes = '0' + minutes;
            }

            element.find('.statistics .timeSpent').text(hours + ':' + minutes);
        },
        updateLeadersBoard: function(usersData) {
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
    };
})();