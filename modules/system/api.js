var router = require('../../routes.json');

var private = {};
var library = null;
var modules = null;
private.apies = {};


function Api(cb, _library) {
	library = _library;
	cb(null, this);
}

Api.prototype.onBind = function (_modules) {
	modules = _modules;

	router.forEach(function (route) {
		private.apies[route.method + " " + route.path] = require(route.handler);
	});

	library.sandbox.onMessage(function (message, cb) {
		var handler = private.apies[message.method + " " + message.path];
		if (handler) {
			handler(message.query, library, modules, function (err, response) {
				cb(err, response);
			});
		} else {
			cb("api not found");
		}
	});
}

module.exports = Api;