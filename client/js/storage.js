Puzzle.Storage = (function() {
    function getUserId() {
        if(localStorage.userId) {
            return localStorage.userId;
        }
        return null;
    }

    function getBackground() {
        if(localStorage.background) {
            return localStorage.background;
        }
        return null;
    }

    function setUserId(userId) {
        localStorage.userId = userId;
    }

    function setBackground(background) {
        localStorage.background = background;
    }

    return {
        getUserId: getUserId,
        setUserId: setUserId,
        getBackground: getBackground,
        setBackground: setBackground
    };
})();