var codius = process.binding('async'),
	routes = require('./api/routes.js'),
	jayson = require('jayson'),
	config = require('./config.json');

var server = jayson.server({
	api: function (path, method, body, callback) {
		var router = routes.filter(function (r) {
			return (r.path == path && r.method == method);
		});

		if (!router) {
			return callback("Router not found");
		}

		router.router(body, function (result) {
			callback(null, result);
		});
	}
});

server.http().listen(config.jayson_port);
console.log("launched");