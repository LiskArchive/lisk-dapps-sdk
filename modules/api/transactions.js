/*
	Lisk transactions API calls
 */

var private = {}, self = null,
library = null, modules = null;


/**
 * Creates instance of Transactions API. Use *modules.api.transactions* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
function Transactions(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

/**
 * Get transactions by filter.
 * @param filter - Filter object.
 * @param filter.blockId - Id of block where transaction applied.
 * @param filter.type - Type of transaction.
 * @param filter.senderPublicKey - Sender public key of transaction.
 * @param filter.senderId - Address of transaction sender.
 * @param filter.recipientId - Address of transaction recipient.
 * @param filter.amount - Amount of transaction.
 * @param filter.limit - Limit of transactions.
 * @param filter.offset - Offset of transactions.
 * @param filter.orderBy - Field to sort transaction.
 * @param {Transactions~getTransactionsCallback} cb - Callback handles response from Lisk.
 */
Transactions.prototype.getTransactions = function (filter, cb) {
	var message = {
		call: "transactions#getTransactions",
		args: {
			blockId: filter.blockId,
			limit: filter.limit,
			type: filter.type,
			orderBy: filter.orderBy,
			offset: filter.offset,
			senderPublicKey: filter.senderPublicKey,
			senderId: filter.senderId,
			recipientId: filter.recipientId,
			senderUsername: filter.senderUsername,
			recipientUsername: filter.recipientUsername
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Transactions~getTransactionsCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.count - Total count of transactions that found by filter.
 * @param response.transactions - Array of transactions.
 */

/**
 * Get transaction.
 * @param id - Id of transaction.
 * @param {Transactions~getTransaction} cb - Callback handles response from Lisk.
 */
Transactions.prototype.getTransaction = function (id, cb) {
	var message = {
		call: "transactions#getTransaction",
		args: {
			id: id
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Transactions~getTransaction
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.transaction - Transaction object.
 */

/**
 * Get unconfirmed transaction.
 * @param id - Id of unconfirmed transaction.
 * @param {Transactions~getUnconfirmedTransaction} cb - Callback handles response from Lisk.
 */
Transactions.prototype.getUnconfirmedTransaction = function (id, cb) {
	var message = {
		call: "transactions#getUnconfirmedTransaction",
		args: {
			id: id
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Transactions~getUnconfirmedTransaction
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.transaction - Transaction object.
 */

/**
 * Get list of unconfirmed transactions.
 * @param {Transactions~getUnconfirmedTransactions} cb - Callback handles response from Lisk.
 */
Transactions.prototype.getUnconfirmedTransactions = function (cb) {
	var message = {
		call: "transactions#getUnconfirmedTransactions",
		args: {
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Transactions~getUnconfirmedTransactions
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.transactions - Array of unconfirmed transactions.
 */

/**
 * Send transaction.
 * @param secret - Secret of sender.
 * @param amount - Amount of transaction.
 * @param recipientId - Address of recipient.
 * @param publicKey - Public key of sender (optional).
 * @param secondSecret - Second secret if second signature enabled (optional).
 * @param requesterPublicKey - Public key of account if account under multisignature (optional).
 * @param {Transactions~addTransactionsCallback} cb - Callback handles response from Lisk.
 */
Transactions.prototype.addTransactions = function (secret, amount, recipientId, publicKey, secondSecret, requesterPublicKey) {
	var message = {
		call: "transactions#addTransactions",
		args: {
			secret: secret,
			amount: amount,
			recipientId: recipientId,
			publicKey: publicKey,
			secondSecret: secondSecret,
			requesterPublicKey: requesterPublicKey
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Transactions~addTransactionsCallback
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.transactionId - Id of sent transaction.
 */

Transactions.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Transactions;
