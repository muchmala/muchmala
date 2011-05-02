(function() {

var Panel = Backbone.View.extend({

    el: $('nav'),

    initialize: function(stngs) {        
        var user = stngs.user, menu = stngs.menu
        var leadersView = new LeadersView({collection: stngs.leaders});
        var statisticsView = new StatisticsView({model: stngs.puzzle});
        var userNameDialog = new Puzz.Views.UserNameDialog(user);
        
        var self = this;
        
        this.el.find('.openMenu').click(function() {
            if (!menu.shown) { menu.show(); }
        });
        this.el.find('.user .name').click(function() {
            if(!userNameDialog.shown) { userNameDialog.show(); }
        });
        
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
        
        user.once('change', function() {
            self.el.find('.user').show();
        });
        user.bind('change', function() {
            self.el.find('.expcol').show();
            self.el.find('.user .num').text(user.get('score'));
            self.el.find('.user .name').text(user.get('name'));
            self.el.addClass('filled');
        });
        user.bind('change:score', function() {
            self.el.find('.user .num').text(user.get('score'));
        });
    },

    show: function() {
        this.el.show();
    },

    loading: function(percent) {
        this.el.find('.progressbar i').css('width', percent + '%');
        this.el.find('.progressbar span').html(percent + '%');
    },

    loadingComplete: function() {
        setTimeout(_.bind(function() {
            this.el.find('.progressbar').fadeOut();
        }, this), 500)
    }
    
});

Puzz.Views.Panel = Panel;

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