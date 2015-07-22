var private = {};
private.library = null;

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

module.exports = Transport;