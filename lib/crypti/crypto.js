var private = {};
private.sandbox = null;

function Crypto(sandbox) {
	private.sandbox = sandbox;
}

Crypto.prototype.encrypt = function (secret, message, cb) {
	var message = {
		call: "crypto#encryptbox",
		args: {
			message: message,
			secret: secret
		}
	};

	private.sandbox.sendMessage(message, cb);
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

	private.sandbox.sendMessage(message, cb);
}

module.exports = Crypto;