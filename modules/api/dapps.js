var private = {}, self = null,
	library = null, modules = null;

/**
 * Creates instance of Dapps API. Use *modules.api.dapps* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
function Dapps(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

/**
 * Get genesis block of DApp.
 * @param {Dapps~getGenesisCallback} cb - Callback handles response from Crypti.
 */
Dapps.prototype.getGenesis = function (cb) {
	var message = {
		call: "dapps#getGenesis",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Dapps~getGenesisCallback
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.pointId - Block id when Dapp started work.
 * @param response.pointHeight - Height of block when Dapp started work.
 * @param response.authorId - Address of author of Dapp.
 */

/**
 * Send withdrawal of funds from DApp.
 * @param opts - Parameters for transaction
 * @param opts.secret - Secret of account to withdrawal
 * @param opts.amount - Amount to withdrawal
 * @param opts.recipientId - Recipient of withdrawal
 * @param opts.transactionId - Transaction id of request to withdrawal.
 * @param opts.secondSecret - Second secret to withdrawal (optional).
 * @param opts.publicKey - Public key of account (optional).
 * @param opts.multisigAccountPublicKey - Multisignature account to withdrawal (optional).
 * @param {Dapps~sendWithdrawal} cb - Callback handles response from Crypti.
 */
Dapps.prototype.sendWithdrawal = function (opts, cb) {
	var message = {
		call: "dapps#sendWithdrawal",
		args: opts
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Dapps~sendWithdrawal
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.transactionId - id of sent transaction.
 */

/**
 * Find common block for DApp.
 * @param cb - Callback handles response from Crypti.
 */
Dapps.prototype.getCommonBlock = function (cb) {
	var message = {
		call: "dapps#getCommonBlock",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}


/**
 * Change state of dapp to ready.
 * @param {Dapps~setReadyCallback} cb - Callback handles response from Crypti.
 */
Dapps.prototype.setReady = function (cb) {
	var message = {
		call: "dapps#setReady",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Dapps~setReadyCallback
 * @param error - Error of api call execution.
 */

Dapps.prototype.getWithdrawalLastTransaction = function (cb) {
	var message = {
		call: "dapps#getWithdrawalLastTransaction",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Dapps.prototype.getBalanceTransactions = function (lastTransactionId, cb) {

	var message = {
		call: "dapps#getBalanceTransactions",
		args: {
			lastTransactionId: lastTransactionId
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Dapps.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Dapps;