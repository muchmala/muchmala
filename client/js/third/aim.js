window.AIM = {
    frame: function(options) {
        var name = 'f' + Math.floor(Math.random() * 99999);
        var iframe = $(document.createElement('iframe'));
        
        iframe.attr('src', 'about:blank');
        iframe.attr('name', name);
        iframe.attr('id', name);
        
        iframe.appendTo(document.body);
        
        iframe.bind('load', function() {
            if (!_.isUndefined(options) &&  _.isFunction(options.onComplete)) {
                var response = iframe.get(0).contentDocument.body.innerHTML;
                response = response.replace(/^\<pre[^\>]*\>/gi, '');
                response = response.replace(/\<\/pre\>$/gi, '');
                options.onComplete(JSON.parse(response));
            }
            iframe.remove();
        });
        
        return name;
    },

    submit: function(form, options) {
        form.setAttribute('target', this.frame(options));
        form.submit();
        
        if (!_.isUndefined(options) && _.isFunction(options.onStart)) {
            options.onStart();
        }
    }
};