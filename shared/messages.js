(function(ns) {

ns.userData      = 'userData';
ns.puzzleData    = 'puzzleData';
ns.initialize    = 'initialize';
ns.lockPiece     = 'lockPiece';
ns.selectPiece   = 'selectPiece';
ns.releasePiece  = 'releasePiece';
ns.unlockPieces  = 'unlockPieces';
ns.swapPieces    = 'swapPieces';
ns.leadersBoard  = 'leadersBoard';
ns.completionPercentage = 'completionPercentage';
ns.connectedUsersCount = 'connectedUsersCount';

ns.create = function(event, data) {
    return JSON.stringify({event: event, data: data});
};

}((typeof exports === 'undefined') ? window.MESSAGES = {} : exports));