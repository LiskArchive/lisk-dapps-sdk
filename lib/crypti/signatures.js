var private = {};
private.library = null;

function Signatures(cb, library) {
	private.library = library;
	cb(null, this);
}

Signatures.prototype.getFee = function (cb) {
	var message = {
		call: "signatures#getFee",
		args: {
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Signatures.prototype.addSignature = function (secret, secondSecret, publicKey, cb) {
	var message = {
		call: "signatures#addSignature",
		args: {
			secret: secret,
			secondSecret: secondSecret,
			publicKey: publicKey
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

module.exports = Signatures;