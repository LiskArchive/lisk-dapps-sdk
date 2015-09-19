var private = {}, self = null,
library = null, modules = null;

function Signatures(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Signatures.prototype.getFee = function (cb) {
	var message = {
		call: "signatures#getFee",
		args: {
		}
	};

	library.sandbox.sendMessage(message, cb);
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

	library.sandbox.sendMessage(message, cb);
}

Signatures.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Signatures;