var private = {};
private.library = null;
private.modules = null;

function Crypto(cb, library) {
	private.library = library;
	cb(null, this);
}

Crypto.prototype.keypair = function (secret, cb) {
	var message = {
		call: "crypto#keypair",
		args: {
			secret: secret
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Crypto.prototype.sign = function (secret, data, cb) {
	var message = {
		call: "crypto#sign",
		args: {
			data: data,
			secret: secret
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Crypto.prototype.sha256 = function (data, cb) {
	var message = {
		call: "crypto#sha256",
		args: {
			data: data
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Crypto.prototype.encrypt = function (secret, message, cb) {
	var message = {
		call: "crypto#encryptbox",
		args: {
			message: message,
			secret: secret
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Crypto.prototype.decrypt = function (secret, nonce, message, cb) {
	var message = {
		call: "crypto#decryptbox",
		args: {
			message: message,
			secret: secret,
			nonce: nonce
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Crypto.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Crypto;