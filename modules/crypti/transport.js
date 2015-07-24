var private = {};
private.library = null;
private.modules = null;

function Transport(cb, library) {
	private.library = library;
	cb(null, this);
}

Transport.prototype.message = function (message, cb) {
	var message = {
		call: "transport#message",
		args: message
	};

	private.library.sandbox.sendMessage(message, cb);
}

Transport.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Transport;