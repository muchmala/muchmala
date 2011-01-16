function toInt(value) {
    return parseInt(value, 10);
}

function log(message) {
    if(window.console != null &&
        window.console.log != null) {
        console.log(message);
    }
}