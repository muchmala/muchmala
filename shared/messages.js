(function(ns) {

ns.userData = 'userData';
ns.puzzleData = 'puzzleData';
ns.piecesData = 'piecesData';
ns.noPuzzles = 'noPuzzles';

ns.initialize = 'initialize';
ns.initialized = 'initialized';

ns.setUserName = 'setUserName';

ns.leadersBoard = 'leadersBoard';
ns.topTwenty = 'topTwenty';

ns.lockPiece = 'lockPiece';
ns.unlockPiece = 'unlockPiece';
ns.swapPieces = 'swapPieces';

ns.scoreAdded = 'scoreAdded';

ns.create = function(event, data) {
    return JSON.stringify({event: event, data: data});
};

}((typeof exports === 'undefined') ? window.MESSAGES = {} : module.exports));