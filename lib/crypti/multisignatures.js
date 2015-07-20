var private = {};
private.sandbox = null;

function Multisignatures(sandbox) {
	private.sandbox = sandbox;
}

Multisignatures.prototype.pending = function (publicKey, cb) {
	var message = {
		call: "multisignatures#pending",
		args: {
			publicKey: publicKey
		}
	};

	private.sandbox.sendMessage(message, cb);
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

	private.sandbox.sendMessage(message, cb);
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

	private.sandbox.sendMessage(message, cb);
}

module.exports = Multisignatures;