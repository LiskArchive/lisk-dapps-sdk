var private = {};
private.sandbox = null;

function Signatures(sandbox) {
	private.sandbox = sandbox;
}

Signatures.prototype.getFee = function (cb) {
	var message = {
		call: "signatures#getFee",
		args: {
		}
	};

	private.sandbox.sendMessage(message, cb);
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

	private.sandbox.sendMessage(message, cb);
}

module.exports = Signatures;