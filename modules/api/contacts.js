/*
 Lisk contacts API calls
 */

var private = {}, self = null,
library = null, modules = null;


/**
 * Creates instance of Blocks API. Use *modules.api.blocks* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
function Contacts(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

/**
 * Get contacts of account.
 * @param publicKey - Public key of account.
 * @param {Contacts~getContactsCallback} cb - Callback handles response from Lisk.
 */
Contacts.prototype.getContacts = function (publicKey, cb) {
	var message = {
		call: "contacts#getContacts",
		args: {
			publicKey: publicKey
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Contacts~getContactsCallback
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.followers - Who added you to contacts. Contains array of accounts.
 * @param response.contacts - Accounts that you added in your contacts list. Contains array of accounts.
 */

/**
 * Add new contact.
 * @param secret - Account secret.
 * @param publicKey - Account public key (optional).
 * @param secondSecret - Second secret if second signature enabled (optional).
 * @param following - Address/username of account to add to contacts.
 * @param {Contacts~addContactCallback} cb - Callback handles response from Lisk
 */
Contacts.prototype.addContact = function (secret, publicKey, secondSecret, following, cb) {
	var message = {
		call: "contacts#addContact",
		args: {
			secret: secret,
			publicKey: publicKey,
			secondSecret: secondSecret,
			following: following
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * Contacts~addContactCallback
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.transactionId - id of sent transaction.
 */


/**
 * Get fee amount to add contact.
 * @param {Contacts~getFeeCallback} cb - Callback handles response from Lisk.
 */

Contacts.prototype.getFee = function (cb) {
	var message = {
		call: "contacts#getFee",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Contacts~getFeeCallback
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.fee - Amount of fee to add contact.
 */

Contacts.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Contacts;
