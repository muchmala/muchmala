window.Puzz = (function(ns) {

function Panel(puzzle, user, leaders, menu) {
    this.element = $('nav').draggable({containment: 'window'});

    var userNameDialog = new ns.UserNameDialog(server);
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
	    this.element.find('.user .num').text(user.score);
	    this.element.find('.user .name').text(user.name);
	    this.element.addClass('filled');
    }, this));

	puzzle.on('change', _.bind(function() {
		this.element.find('.statistics .swaps').text(puzzle.swapsCount);
		this.element.find('.statistics .connected').text(puzzle.connectedCount);
	    this.element.find('.statistics .complete').text(puzzle.completion + '%');
	    this.element.find('.statistics .quantity').text(puzzle.vLength * puzzle.hLength);
	}, this));
	
	puzzle.once('change', _.bind(function() {
        this.updateTimeSpent(puzzle.created, data.completed);
        setInterval(_.bind(function() {
            this.updateTimeSpent(puzzle.created, data.completed);
        }, this), 6000);
    }, this));

    leaders.on('change', _.bind(function() {
		this.updateLeadersBoard();
    }, this));

    this.leadersShow = 'score';
	this.leadersViewport = this.element.find('.leadersboard .viewport');
	this.leadersViewport.viewport({position: 'top'});
    this.leadersViewport.viewport('content').scraggable({axis: 'y', containment: 'parent'});
    this.leadersViewport.scrolla({content: this.leadersViewport.viewport('content')});

    this.element.find('.leadersboard .button').toggle(
		function() {
	        self.leadersShow = 'found';
			$(this).html(self.leadersShow);
	        self.updateLeadersBoard();
		},
		function() {
	        self.leadersShow = 'score';
			$(this).html(self.leadersShow);
	        self.updateLeadersBoard();
		});
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
    var timeSpent = ns.TimeHelper.diffHoursMinutes(creationTime, completionDate);
    this.element.find('.statistics .timeSpent').text(timeSpent);
};

Proto.updateLeadersBoard = function() {
	var leadersCount = leaders.list.length;
	if(leadersCount > 0) {
    	var leadersShow = this.leadersShow;
		var leadersBoard = this.leadersViewport.find('.list').empty();
	    var leadersList = leaders.getSortedBy(this.leadersShow);

	    for(var i = leadersCount; i > 0; i--) {
	        var row = $('<em></em>');
	        var data = leadersList[i-1];

	        row.append('<span class="status ' + (data.online ? 'online' : 'offline') + '"></span>');
	        row.append('<span class="name">' + data.name + '</span>');
	        row.append('<span class="num">' + data[this.leadersShow] + '</span>');
	        row.appendTo(leadersBoard);
	    }
		this.leadersViewport.height(row.height() * (leadersCount < 5 ? leadersCount : 5));
	}
	this.leadersViewport.viewport('update');
	this.leadersViewport.scrolla('update');
};

return ns.Views.Panel = Panel, ns;

})(window.Puzz);