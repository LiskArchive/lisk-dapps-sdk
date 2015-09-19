var private = {}, self = null,
library = null, modules = null;

function Multisignatures(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Multisignatures.prototype.pending = function (publicKey, cb) {
	var message = {
		call: "multisignatures#pending",
		args: {
			publicKey: publicKey
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Multisignatures.prototype.sign = function (secret, publicKey, transactionId, cb) {
	var message = {
		call: "multisignatures#sign",
		args: {
			secret: secret,
			publicKey: publicKey,
			transactionId: transactionId
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Multisignatures.prototype.addMultisignature = function (secret, publicKey, secondSecret, min, lifetime, keysgroup, cb) {
	var message = {
		call: "multisignatures#addMultisignature",
		args: {
			secret: secret,
			publicKey: publicKey,
			secondSecret: secondSecret,
			min: min,
			lifetime: lifetime,
			keysgroup: keysgroup
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Multisignatures.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Multisignatures;