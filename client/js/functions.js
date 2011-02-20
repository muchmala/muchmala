function log(message) {
    if(window.console != null &&
        window.console.log != null) {
        console.log(message);
    }
}

Puzzle = {};