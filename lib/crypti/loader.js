var private = {};
private.sandbox = null;

function Loader(sandbox) {
	private.sandbox = sandbox;
}

Loader.prototype.status = function (cb) {
	var message = {
		call: "loader#status",
		args: {}
	};

	private.sandbox.sendMessage(message, cb);
}

Loader.prototype.sync = function (cb) {
	var message = {
		call: "loader#sync",
		args: {}
	};

	private.sandbox.sendMessage(message, cb);
}

module.exports = Loader;