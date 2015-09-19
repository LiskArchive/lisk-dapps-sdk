var private = {}, self = null,
library = null, modules = null;

function Loader(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Loader.prototype.status = function (cb) {
	var message = {
		call: "loader#status",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Loader.prototype.sync = function (cb) {
	var message = {
		call: "loader#sync",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Loader.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Loader;