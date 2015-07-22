var private = {};
private.library = null;
private.modules = null;

function Loader(cb, library) {
	private.library = library;
	cb(null, this);
}

Loader.prototype.status = function (cb) {
	var message = {
		call: "loader#status",
		args: {}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Loader.prototype.sync = function (cb) {
	var message = {
		call: "loader#sync",
		args: {}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Loader.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Loader;