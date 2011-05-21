var controllers = [
    require('.indexController'),
    require('.createController'),
    require('.authController')
];

module.exports = function(server) {
    controllers.forEach(function(controller) {
        controller(server);
    });
};