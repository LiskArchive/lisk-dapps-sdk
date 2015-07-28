var private = {};
var library = null;
var modules = null;

function Transport(cb, _library) {
	library = _library;
	cb(null, this);
}

Transport.prototype.message = function (topic, message, cb) {
	var message = {
		call: "transport#message",
		args: {
			message: message,
			topic: topic
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Transport.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Transport;