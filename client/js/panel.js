window.Puzz = (function(ns) {

function Panel(server, menu) {
    this.element = $('nav');
    this.observer = ns.Observer();

    this.element.draggable({containment: 'window'});

    var userNameDialog = new ns.UserNameDialog(server);

    var self = this;

    this.element.find('.user .name').click(function() {
        if(!userNameDialog.shown) { userNameDialog.show(); }
    });
    this.element.find('header h1 span').click(function() {
        if (!menu.shown) { menu.show(); }
    });
    this.element.find('header .howto').click(function() {
        if (!menu.shown) { menu.show(); }
        menu.openPage('howtoplay');
    });
    this.element.find('.expcol').click(function() {
        if($(this).hasClass('opened')) {
            self.collapse();
        } else {
            self.expand();
        }
    });

    server.on(MESSAGES.userData, function(data) {
        ns.Storage.user.id(data.id);
        self.setUserData(data);
    });
    server.on(MESSAGES.leadersBoard, function(data) {
        self.leadersData = data;
        self.updateLeadersBoard();
    });

    server.on(MESSAGES.swapsCount, function(count) { self.setSwapsCount(count); });
    server.on(MESSAGES.piecesData, function() { self.element.removeClass('loading'); });
    server.on(MESSAGES.puzzleData, function(data) { self.setPuzzleData(data); });

    server.once(MESSAGES.puzzleData, function(data) {
        var creationDate = new Date(data.created);
        var completionDate = null;
        
        if (!_.isUndefined(data.completed)) {
            completionDate = new Date(data.completed);
        }

        self.updateTimeSpent(creationDate, completionDate);
        setInterval(function() {
            self.updateTimeSpent(creationDate, completionDate);
        }, 6000);
    });

    this.leadersData = null;
    this.leadersShow = 'score';
	
	this.leadersViewport = this.element.find('.leadersboard .viewport');
	
	this.leadersViewport.viewport({position: 'top'});
    this.leadersViewport.viewport('content').scraggable({axis: 'y', containment: 'parent'});
    this.leadersViewport.scrolla({content: this.leadersViewport.viewport('content')});

    this.element.find('.leadersboard .button').click(function() {
        if (self.leadersShow == 'score') {
            self.leadersShow = 'found';
        } else if (self.leadersShow == 'found') {
            self.leadersShow = 'score';
        }
        $(this).html(self.leadersShow);
        self.updateLeadersBoard();
    });

    this.on = this.observer.on;
}

var Proto = Panel.prototype;

Proto.show = function() {
    this.element.show();
};

Proto.expand = function() {
    this.element.find('header').show();
    this.element.find('.statistics').show();
    this.element.find('.leadersboard').show();
    this.element.find('.expcol').addClass('opened');

	this.updateLeadersBoard();
};

Proto.collapse = function() {
    this.element.find('header').hide();
    this.element.find('.statistics').hide();
    this.element.find('.leadersboard').hide();
    this.element.find('.expcol').removeClass('opened');
};

Proto.setUserData = function(data) {
    this.element.find('.expcol').show();
    this.element.find('.user .num').text(data.score);
    this.element.find('.user .name').text(data.name);
    this.element.addClass('filled');
};

Proto.setPuzzleData = function(data) {
    this.setSwapsCount(data.swaps);
    this.setCompleteLevel(data.completion);
    this.setConnectedUsersCount(data.connected);
    this.element.find('.statistics .quantity').text(data.vLength * data.hLength);
};

Proto.setSwapsCount = function(count) {
    this.element.find('.statistics .swaps').text(count);
};

Proto.setConnectedUsersCount = function(count) {
    this.element.find('.statistics .connected').text(count);
};

Proto.setCompleteLevel = function(percent) {
    this.element.find('.statistics .complete').text(percent + '%');
};

Proto.updateTimeSpent = function(creationTime, completionDate) {
    var timeSpent = ns.TimeHelper.diffHoursMinutes(creationTime, completionDate);
    this.element.find('.statistics .timeSpent').text(timeSpent);
};

Proto.updateLeadersBoard = function() {
	var leadersCount = _.size(this.leadersData);
    
	if(leadersCount > 0) {
    	var leadersShow = this.leadersShow;
		var leadersBoard = this.leadersViewport.find('.list').empty();

	    this.leadersData = _.sortBy(this.leadersData, function(row) {
	        return row[leadersShow];
	    });

	    for(var i = this.leadersData.length; i > 0; i--) {
	        var row = $('<em></em>');
	        var data = this.leadersData[i-1];

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

ns.Panel = Panel;

return ns;

})(window.Puzz || {});