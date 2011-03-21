(function(ns) {

ns.userData      = 'userData';
ns.puzzleData    = 'puzzleData';
ns.piecesData    = 'piecesData';
ns.initialize    = 'initialize';
ns.lockPiece     = 'lockPiece';
ns.selectPiece   = 'selectPiece';
ns.releasePiece  = 'releasePiece';
ns.unlockPieces  = 'unlockPieces';
ns.swapPieces    = 'swapPieces';
ns.setUserName   = 'setUserName';
ns.leadersBoard  = 'leadersBoard';
ns.generalLeadersBoard  = 'generalLeadersBoard';
ns.completionPercentage = 'completionPercentage';
ns.connectedUsersCount = 'connectedUsersCount';

ns.create = function(event, data) {
    return JSON.stringify({event: event, data: data});
};

}((typeof exports === 'undefined') ? window.MESSAGES = {} : exports));