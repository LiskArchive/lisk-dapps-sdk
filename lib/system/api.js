var router = require('../../routes.json');

var private = {};
private.library = null;
private.modules = null;
private.apies = {};


function Api(cb, library) {
	private.library = library;
	cb(null, this);
}

Api.prototype.onBind = function (modules) {
	router.forEach(function (route) {
		private.apies[route.method + " " + route.path] = require(route.handler);
	});

	private.library.sandbox.onMessage(function (message, cb) {
		var handler = private.apies[message.method + " " + message.path];
		if (handler) {
			handler(message.query, modules, function (err, response) {
				cb(err, response);
			});
		} else {
			cb("api not found");
		}
	});
}

module.exports = Api;