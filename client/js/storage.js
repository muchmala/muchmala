window.Puzz = (function(ns) {

function Storage() {
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
            },
            lastViewedPage: function(pageName) {
                if (_.isUndefined(pageName)) {
                    return storage.menuLastViewedPage;
                }
                storage.menuLastViewedPage = pageName;
            }
        }
    };
};

return ns.Utils.Storage = Storage(), ns;

})(window.Puzz);
