/*
 Lisk delegates API calls
 */

var private = {}, self = null,
library = null, modules = null;

/**
 * Creates instance of Delegates API. Use *modules.api.delegates* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
function Delegates(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

/**
 * Get delegate by filter.
 * @param filter - Filter to get delegate.
 * @param filter.transactionId - Id of transaction where delegate registered.
 * @param filter.publicKey - Public key of delegate.
 * @param filter.username - Username of delegate.
 * @param {Delegates~getDelegateCallback} cb - Callback handles response from Lisk.
 */
Delegates.prototype.getDelegate = function (filter, cb) {
	var message = {
		call: "delegates#getDelegate",
		args: {
			transactionId: filter.transactionId,
			publicKey: filter.publicKey,
			username: filter.username
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Delegates~getDelegateCallback
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.delegate - Delegate object.
 * @param response.delegate.username - Username of delegate.
 * @param response.delegate.vote - Amount of votes for delegate.
 * @param response.delegate.address - Address of delegate.
 * @param response.delegate.publicKey - Public key of delegate.
 * @param response.delegate.rate - Position of delegate in delegates list.
 * @param response.delegate.productivity - Productivity of delegate.
 */

/**
 * Get delegate by filter.
 *
 * @param filter - Filter to get delegates.
 * @param filter.limit - Limit of delegates to get.
 * @param filter.offset - Offset of delegates to get.
 * @param filter.orderBy - Order by field to sort delegates.
 * @param {Delegates~getDelegatesCallback} cb - Callback handles response from Lisk.
 */
Delegates.prototype.getDelegates = function (filter, cb) {
	var message = {
		call: "delegates#getDelegates",
		args: {
			limit: filter.limit,
			offset: filter.offset,
			orderBy: filter.orderBy
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Delegates~getDelegatesCallback
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.delegates - Array of delegates.
 */

/**
 * Get fee amount of delegate registration.
 *
 * @param {Delegates~getFeeCallback} cb - Callback handles response from Lisk.
 */
Delegates.prototype.getFee = function (cb) {
	var message = {
		call: "delegates#getFee",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Delegates~getFeeCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.fee - Amount of fee to register delegate.
 */


/**
 * Get amount forged by delegate.
 * @param generatorPublicKey - Public key of delegate.
 * @param {Delegates~getForgedByAccount} cb - Callback handles response from Lisk.
 */
Delegates.prototype.getForgedByAccount = function (generatorPublicKey, cb) {
	var message = {
		call: "delegates#getForgedByAccount",
		args: {
			generatorPublicKey: generatorPublicKey
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Delegates~getForgedByAccount
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.fees - Amount of LISK that delegate forged.
 */

/**
 * Register delegate.
 * @param secret - Secret key of account.
 * @param publicKey - Public key of account (optional).
 * @param secondSecret - Second secret of account, if second signature enabled (optional).
 * @param username - Username to register.
 * @param {Delegates~addDelegate} cb - Callback handles response from Lisk.
 */
Delegates.prototype.addDelegate = function (secret, publicKey, secondSecret, username, cb) {
	var message = {
		call: "delegates#addDelegate",
		args: {
			secret: secret,
			publicKey: publicKey,
			secondSecret: secondSecret,
			username: username
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Delegates~addDelegate
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.transactionId - Id of sent transaction.
 */

Delegates.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Delegates;
