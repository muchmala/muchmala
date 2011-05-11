window.Puzz.Storage = (function() {
    var storage = window.localStorage;

    return {
        user: {
            id: function(userId) {
                if (_.isUndefined(userId)) {
                    return storage.userId;
                }
                storage.userId = userId;
            }
        },
        menu: {
            isHowToPlayShown: function(pageName) {
                return storage.menuHowToPlayShown == '1';
            },
            setHowToPlayShown: function() {
                storage.menuHowToPlayShown = 1;
            }
        }
    };
})();