var private = {};
private.library = null;

function Multisignatures(cb, library) {
	private.library = library;
	cb(null, this);
}

Multisignatures.prototype.pending = function (publicKey, cb) {
	var message = {
		call: "multisignatures#pending",
		args: {
			publicKey: publicKey
		}
	};

	private.library.sandbox.sendMessage(message, cb);
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

	private.library.sandbox.sendMessage(message, cb);
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

	private.library.sandbox.sendMessage(message, cb);
}

module.exports = Multisignatures;