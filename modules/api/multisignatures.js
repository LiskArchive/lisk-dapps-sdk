var private = {}, self = null,
library = null, modules = null;

/**
 * Creates instance of Multisignatures API. Use *modules.api.multisignatures* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
function Multisignatures(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

/**
 * Get pending transactions, that account need to sign.
 *
 * @param publicKey - Public key of account.
 * @param {Multisignatures~pendingCallback} cb - Callback handles response from Lisk.
 */
Multisignatures.prototype.pending = function (publicKey, cb) {
	var message = {
		call: "multisignatures#pending",
		args: {
			publicKey: publicKey
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Multisignatures~pendingCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.transactions - Array of transactions to sign.
 * @param response.transactions[0].transaction - Transaction object.
 * @param response.transactions[0].lifetime - Life time of transaction.
 * @param response.transactions[0].max - Count of signatures.
 * @param response.transactions[0].min - Minimum amount of signatures to verify transaction.
 */

/**
 * Sign multisignature transaction.
 *
 * @param secret - Secret of account.
 * @param publicKey - Public key of account (optional).
 * @param transactionId - Id of transaction to sign.
 * @param {Multisignatures~signCallback} cb - Callback handles response from Lisk.
 */
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

/**
 * @callback Multisignatures~signCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 */

/**
 * Enable multisignature on account.
 *
 * @param secret - Secret key of account.
 * @param publicKey - Public key of account (optional).
 * @param secondSecret - Second secret of account if second signature enabled (optional).
 * @param min - Minimum signers of multisignature to verify transaction.
 * @param lifetime - Life time of transaction. From 1 to 72 hours.
 * @param keysgroup - Array of public keys of members of multisignature. Each public key must start with '+'.
 * @param {Multisignatures~addCallback} cb - Callback handles response from Lisk.
 */
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

/**
 * @callback Multisignatures~addCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.transactionId - Id of sent transaction.
 */

Multisignatures.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Multisignatures;
