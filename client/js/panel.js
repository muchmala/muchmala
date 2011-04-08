Puzz.Panel = (function() {
    var element = $('nav');
    var observer = Utils.Observer();
    var server = Puzz.Server;
    var m = MESSAGES;

    element.draggable({containment: 'document'});

    var userNameDialog = new Puzz.UserNameDialog();

    element.find('.user .name').click(function() {
        if(!userNameDialog.shown) {
            userNameDialog.show();
        }
    });
    element.find('header h1 span').click(function() {
        if (Puzz.MenuDialog.shown) { return; }
        Puzz.MenuDialog.show();
    });
    element.find('.expcol').click(function() {
        if($(this).hasClass('opened')) {
            self.collapse();
        } else {
            self.expand();
        }
    });

    server.subscribe(m.userData, function(data) {
        Puzz.Storage.user.id(data.id);
        self.setUserData(data);
    });
    server.subscribe(m.swapsCount, function(count) {
        self.setSwapsCount(count);
    });
    server.subscribe(m.puzzleData, function(data) {
        self.setPuzzleData(data);
    });
    server.subscribe(m.piecesData, function() {
        element.removeClass('loading');
    });
    server.subscribe(m.leadersBoard, function(data) {
        leadersData = data;
        self.updateLeadersBoard();
    });

    var leadersData = null;
    var leadersShow = 'score';

    element.find('.leadersboard .button').click(function() {
        if (leadersShow == 'score') {
            leadersShow = 'found';
        } else if (leadersShow == 'found') {
            leadersShow = 'score';
        }
        $(this).html(leadersShow);
        self.updateLeadersBoard();
    });

    var self = {
        on: observer.on,

        expand: function() {
            element.find('header').show();
            element.find('.statistics').show();
            element.find('.leadersboard').show();
            element.find('.expcol').addClass('opened');
        },
        collapse: function() {
            element.find('header').hide();
            element.find('.statistics').hide();
            element.find('.leadersboard').hide();
            element.find('.expcol').removeClass('opened');
        },

        loading: function() {
            element.addClass('loading');
        },
        
        setUserData: function(data) {
            element.find('.expcol').show();
            element.find('.user .num').text(data.score);
            element.find('.user .name').text(data.name);
            element.addClass('filled');
        },
        setPuzzleData: function(data) {
            this.setSwapsCount(data.swaps);
            this.setCompleteLevel(data.completion);
            this.setConnectedUsersCount(data.connected);
            element.find('.statistics .quantity').text(data.vLength * data.hLength);

            var creationDate = new Date(data.created);
            var completionDate = new Date(data.completed);

            if (_.isUndefined(data.completed)) {
                completionDate = new Date();
            }

            this.updateTimeSpent(creationDate, completionDate);
            setInterval(_.bind(function() {
                this.updateTimeSpent(creationDate, completionDate);
            }, this), 60000);
        },
        setSwapsCount: function(count) {
            element.find('.statistics .swaps').text(count);
        },
        setConnectedUsersCount: function(count) {
            element.find('.statistics .connected').text(count);
        },
        setCompleteLevel: function(percent) {
            element.find('.statistics .complete').text(percent + '%');
        },
        
        updateTimeSpent: function(creationTime, completionDate) {
            var timeSpent = Puzz.TimeHelper.diffHoursMinutes(creationTime, completionDate);
            element.find('.statistics .timeSpent').text(timeSpent);
        },
        
        updateLeadersBoard: function() {
            if(_.size(leadersData) == 0) { return; }

            var leadersBoard = element.find('.leadersboard ul').empty();

            leadersData = _.sortBy(leadersData, function(row) {
                return row[leadersShow];
            });

            for(var i = leadersData.length; i > 0; i--) {
                var row = $('<li></li>');
                var data = leadersData[i-1];
                
                row.append('<span class="status ' + (data.online ? 'online' : 'offline') + '"></span>');
                row.append('<span class="name">' + data.name + '</span>');
                row.append('<span class="num">' + data[leadersShow] + '</span>');
                row.appendTo(leadersBoard);
            }
        }
    };

    return self;
})();