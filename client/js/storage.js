Puzzle.Storage = (function() {
    function getUserId() {
        if(localStorage.userId) {
            return localStorage.userId;
        }
        return null;
    }

    function setUserId(userId) {
        localStorage.userId = userId;
    }

    return {
        getUserId: getUserId,
        setUserId: setUserId
    };
})();