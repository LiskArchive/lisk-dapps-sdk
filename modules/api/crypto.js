var private = {};
var library = null;
var modules = null;

function Crypto(cb, _library) {
	library = _library;
	cb(null, this);
}

Crypto.prototype.keypair = function (secret, cb) {
	var message = {
		call: "crypto#keypair",
		args: {
			secret: secret
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Crypto.prototype.sign = function (secret, data, cb) {
	var message = {
		call: "crypto#sign",
		args: {
			data: data,
			secret: secret
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Crypto.prototype.sha256 = function (data, cb) {
	var message = {
		call: "crypto#sha256",
		args: {
			data: data
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Crypto.prototype.encrypt = function (secret, message, cb) {
	var message = {
		call: "crypto#encryptbox",
		args: {
			message: message,
			secret: secret
		}
	};

	library.sandbox.sendMessage(message, cb);
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

	library.sandbox.sendMessage(message, cb);
}

Crypto.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Crypto;