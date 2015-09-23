var private = {}, self = null,
library = null, modules = null;

/**
 * Creates instance of Signatures API. Use *modules.api.signatures* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
function Signatures(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

/**
 * Get fee amount of signature creation.
 * @param {Signatures~getFee} cb - Callback handles response from Crypti.
 */
Signatures.prototype.getFee = function (cb) {
	var message = {
		call: "signatures#getFee",
		args: {
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Signatures~getFee
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.fee - Amount of fee to activate second signature.
 */

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