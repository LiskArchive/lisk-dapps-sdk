var private = {}, self = null,
library = null, modules = null;

function Transport(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
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

Transport.prototype.request = function (topic, message, cb) {
	var message = {
		call: "transport#request",
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