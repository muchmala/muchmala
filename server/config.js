var config = {
    production: false,
	static: 'static.puzzle.home',
    
    server: {
        host: '172.16.45.129',
        port: 80
    },
    
    db: {
        host: '172.16.45.129',
        user: 'mongodb',
        name: 'puzzles'
    }
};

module.exports = config;