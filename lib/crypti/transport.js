var private = {};
private.sandbox = null;

function Transport(sandbox) {
	private.sandbox = sandbox;
}

Transport.prototype.message = function (message, cb) {
	var message = {
		call: "transport#message",
		args: message
	};

	private.sandbox.sendMessage(message, cb);
}

module.exports = Transport;