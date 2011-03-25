Puzz.Storage = (function() {
    var storage = window.localStorage;

    return {
        getUserId: function() {
            return storage.userId;
        },
        setUserId: function(userId) {
            storage.userId = userId;
        },

        menu: {
            isShown: function(pageName) {
                return storage.menuShown == '1';
            },
            setShown: function() {
                storage.menuShown = 1;
            },
            lastViewedPage: function(pageName) {
                if (_.isUndefined(pageName)) {
                    return storage.menuLastViewedPage;
                }
                storage.menuLastViewedPage = pageName;
            }
        }
    };
})();