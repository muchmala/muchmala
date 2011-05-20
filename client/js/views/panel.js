(function() {

var Panel = Backbone.View.extend({

    el: $('nav'),

    initialize: function(stngs) {        
        var userView = new UserView({model: stngs.user});
        var leadersView = new LeadersView({collection: stngs.leaders});
        var statisticsView = new StatisticsView({model: stngs.puzzle});
        
        this.el.find('.openMenu').click(function() {
            if (!stngs.menu.shown) stngs.menu.show();
        });
        this.el.find('.createPuzzle').click(function() {
            if (!stngs.create.shown) stngs.create.show();
        });
        
        var self = this;
        
        this.el.find('aside').toggle(function() {
            self.el.animate({right: -160}, {
                duration: 100, 
                step: function() {
                    self.trigger('move');
                },
                complete: function() {
                    self.el.addClass('hidden');
                    self.trigger('hide');
                }
            });
        }, function() {
            self.el.animate({right: 0}, {
                duration: 100, 
                step: function() {
                    self.trigger('move');
                },
                complete: function() {
                    self.el.removeClass('hidden');
                    self.trigger('show');
                }
            });
        });
    },

    loading: function(percent) {
        this.el.find('.progressbar i').css('width', percent + '%');
        this.el.find('.progressbar span').html(percent + '%');
    },

    loadingComplete: function() {
        setTimeout(_.bind(function() {
            this.el.find('.progressbar').fadeOut();
        }, this), 500)
    },
    
    show: function() { this.el.show(); },
    hide: function() { this.el.hide(); }
    
});

Puzz.Views.Panel = Panel;

var UserView = Backbone.View.extend({
    
    el: $('nav .user'),
    
    initialize: function() {
        var userNameDialog = new Puzz.Views.UserNameDialog(this.model);
        var authDialog = new Puzz.Views.AuthDialog();
        
        this.el.find('.name').click(function() {
            if(!userNameDialog.shown) userNameDialog.show();
        });
        this.el.find('.auth').click(function() {
            if(!authDialog.shown && $(this).attr('href') != '/logout') {
                authDialog.show();
            } 
        });
        
        var self = this;
        
        this.model.once('change', function() {
            self.el.show();
        });
        
        this.model.bind('change', function() {
            self.el.find('.num').text(self.model.get('score'));
            self.el.find('.name').text(self.model.get('name'));
        });
        
        this.model.bind('change:score', function() {
            self.el.find('.num').text(self.model.get('score'));
        });
    }
    
});

var StatisticsView = Backbone.View.extend({
    
    el: $('nav .statistics'),
        
    initialize: function() {
        _.bindAll(this, 'render', 'startTimer', 'show');
        
        this.model.once('change', this.show);
        this.model.bind('change', this.render);
        this.model.once('change', this.startTimer);
    },
    
    render: function() {
        var data = this.model.toJSON();
        this.el.find('.swaps').text(data.swaps);
        this.el.find('.connected').text(data.connected);
        this.el.find('.complete').text(data.completion + '%');
        this.el.find('.quantity').text(data.vLength * data.hLength);
    },
    
    startTimer: function() {
        var data = this.model.toJSON();
        this.updateTimeSpent(data.created, data.completed);
        setInterval(_.bind(function() {
            this.updateTimeSpent(data.created, data.completed);
        }, this), 6000);
    },
    
    updateTimeSpent: function(creationTime, completionDate) {
        this.el.find('.timeSpent').text(Puzz.TimeHelper.diffHoursMinutes(creationTime, completionDate));
    },
    
    show: function() { this.el.show(); },
    hide: function() { this.el.hide(); }
    
});

var LeadersView = Backbone.View.extend({
    
    el: $('nav .leadersboard'),
    vp: $('nav .leadersboard .viewport'),
    
    events: {
        'click .button': 'resort'
    },
    
    shows: 'score',
    
    initialize: function() {
        this.vp.viewport({position: 'top'});
        this.vp.viewport('content').scraggable({axis: 'y', containment: 'parent'});
        this.vp.scrolla({content: this.vp.viewport('content')});
        
        _.bindAll(this, 'render', 'show');
        this.collection.once('refresh', this.show);
        this.collection.bind('refresh', this.render);
    },
    
    resort: function() {
        this.shows = this.shows == 'score' ? 'found' : 'score';
        this.el.find('.button').html(this.shows);
        this.render();
    },
    
    render: function() {
        var count = this.collection.length;
        if(count > 0) {
            var list = this.collection.getSortedBy(this.shows);
            var viewport = this.vp.find('.list').empty();
            
            for(var i = count; i > 0; i--) {
                var data = list[i-1].toJSON();
                var row = $('<em></em>');

                row.append('<span class="status ' + (data.online ? 'online' : 'offline') + '"></span>');
                row.append('<span class="name">' + data.name + '</span>');
                row.append('<span class="num">' + data[this.shows] + '</span>');
                row.appendTo(viewport);
            }
            this.vp.height(row.height() * (count < 10 ? count : 10));
        }
        
        this.vp.viewport('update');
        this.vp.scrolla('update');
    },
    
    show: function() { this.el.show(); },
    hide: function() { this.el.hide(); }
    
});

})();