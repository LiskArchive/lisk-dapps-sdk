var router = require('../../routes.json');

var private = {}, self = null,
	library = null, modules = null;
private.apies = {};

function Api(cb, _library) {
	self = this;
	library = _library;

	cb(null, self);
}

private.ns = function (src, path) {
	var o, d;
	d = path.split(".");
	o = src[d[0]];
	for (var i = 0; i < d.length; i++) {
		d = d.slice(1);
		o = o[d[0]];
		if (!o) break;
	}
	return o;
};

Api.prototype.onBind = function (_modules) {
	modules = _modules;

	router.forEach(function (route) {
		private.apies[route.method + " " + route.path] = private.ns(modules, route.handler);
	});

	library.sandbox.onMessage(function (message, cb) {
		var handler = private.apies[message.method + " " + message.path];
		if (handler) {
			handler(message.query, function (err, response) {
				cb(err, response);
			});
		} else {
			cb("api not found");
		}
	});
}

Api.prototype.helloworld = function (query, cb) {
	cb(null, {
		test: "Hello, world!"
	});
}

Api.prototype.message = function (query, cb) {
	library.bus.message("message", query);
	cb(null, {});
}

module.exports = Api;