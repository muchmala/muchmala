(function() {

function Panel(puzzle, user, leaders, menu) {
    this.element = $('nav').draggable({containment: 'window'});

    var userNameDialog = new Puzz.Views.UserNameDialog(user);
    var self = this;

    this.element.find('.user .name').click(function() {
        if(!userNameDialog.shown) { userNameDialog.show(); }
    });
    this.element.find('header h1 span').click(function() {
        if (!menu.shown) { menu.show(); }
    });
    this.element.find('header .howto').click(function() {
        if (!menu.shown) { menu.show('howtoplay'); }
    });
    this.element.find('.expcol').click(function() {
        if($(this).hasClass('opened')) self.collapse(); else self.expand();
    });

    user.on('change', _.bind(function() {
        this.element.find('.expcol').show();
        this.element.find('.user .num').text(user.get('score'));
        this.element.find('.user .name').text(user.get('name'));
        this.element.addClass('filled');
    }, this));
    
    user.on('change:score', _.bind(function() {
        this.element.find('.user .num').text(user.get('score'));
    }, this));

    puzzle.on('change', _.bind(function() {
        var data = puzzle.all();
        this.element.find('.statistics .swaps').text(data.swaps);
        this.element.find('.statistics .connected').text(data.connected);
        this.element.find('.statistics .complete').text(data.completion + '%');
        this.element.find('.statistics .quantity').text(data.vLength * data.hLength);
    }, this));
    
    puzzle.once('change', _.bind(function() {
        var data = puzzle.all();
        this.updateTimeSpent(data.created, data.completed);
        setInterval(_.bind(function() {
            this.updateTimeSpent(data.created, data.completed);
        }, this), 6000);
    }, this));

    leaders.on('change:list', _.bind(function() {
        updateLeadersBoard();
    }, this));

    this.leadersViewport = this.element.find('.leadersboard .viewport');
    this.leadersViewport.viewport({position: 'top'});
    this.leadersViewport.viewport('content').scraggable({axis: 'y', containment: 'parent'});
    this.leadersViewport.scrolla({content: this.leadersViewport.viewport('content')});

    var leadersShow = 'score';
    
    this.element.find('.leadersboard .button').toggle(
        function() {
            leadersShow = 'found';
            $(this).html(leadersShow);
            updateLeadersBoard();
        },
        function() {
            leadersShow = 'score';
            $(this).html(leadersShow);
            updateLeadersBoard();
        });
        
    var updateLeadersBoard = _.bind(function() {
        var leadersCount = leaders.get('list').length;
        if(leadersCount > 0) {
            var leadersList = leaders.getListSortedBy(leadersShow);
            var leadersBoard = this.leadersViewport.find('.list').empty();

            for(var i = leadersCount; i > 0; i--) {
                var row = $('<em></em>');
                var data = leadersList[i-1];

                row.append('<span class="status ' + (data.online ? 'online' : 'offline') + '"></span>');
                row.append('<span class="name">' + data.name + '</span>');
                row.append('<span class="num">' + data[leadersShow] + '</span>');
                row.appendTo(leadersBoard);
            }
            this.leadersViewport.height(row.height() * (leadersCount < 5 ? leadersCount : 5));
        }
        this.leadersViewport.viewport('update');
        this.leadersViewport.scrolla('update');
    }, this);
}

var Proto = Panel.prototype;

Proto.show = function() {
    this.element.show();
};

Proto.loading = function() {
    this.element.addClass('loading');
};

Proto.loadingComplete = function() {
    this.element.removeClass('loading');
};

Proto.expand = function() {
    this.element.find('header').show();
    this.element.find('.statistics').show();
    this.element.find('.leadersboard').show();
    this.element.find('.expcol').addClass('opened');

    this.leadersViewport.viewport('update');
    this.leadersViewport.scrolla('update');
};

Proto.collapse = function() {
    this.element.find('header').hide();
    this.element.find('.statistics').hide();
    this.element.find('.leadersboard').hide();
    this.element.find('.expcol').removeClass('opened');
};

Proto.updateTimeSpent = function(creationTime, completionDate) {
    var timeSpent = Puzz.TimeHelper.diffHoursMinutes(creationTime, completionDate);
    this.element.find('.statistics .timeSpent').text(timeSpent);
};

Puzz.Views.Panel = Panel;

})();