var private = {}, self = null,
	library = null, modules = null;
private.apies = {};
private.loaded = false;

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
}

Api.prototype.onBlockchainLoaded = function () {
	private.loaded = true;
	try {
		var router = require('../../routes.json');
	} catch (e) {
		library.logger("failed router file");
	}

	router.forEach(function (route) {
		private.apies[route.method + " " + route.path] = private.ns(modules, route.handler);
	});

	library.sandbox.onMessage(function (message, cb, callback_id) {
		var handler = private.apies[message.method + " " + message.path];
		if (handler) {
			handler(function (err, response) {
				if (err) {
					err = err.toString();
				}

				cb(err, {response: response}, callback_id);
			}, message.query);
		} else {
			cb("api not found", {}, callback_id);
		}
	});

	modules.api.dapps.setReady(function () {

	});
}

Api.prototype.helloworld = function (cb) {
	cb(null, {
		test: "Hello, world!"
	});
}

Api.prototype.message = function (cb, query) {
	library.bus.message("message", query);
	cb(null, {});
}

module.exports = Api;