/*
 Crypti contacts API calls
 */

var private = {};
private.library = null;
private.modules = null;

function Contacts(cb, library) {
	private.library = library;
	cb(null, this);
}

Contacts.prototype.getContacts = function (publicKey, cb) {
	var message = {
		call: "contacts#getContacts",
		args: {
			publicKey: publicKey
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

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

	private.library.sandbox.sendMessage(message, cb);
}

Contacts.prototype.getHeight = function (cb) {
	var message = {
		call: "contacts#getHeight",
		args: {}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Contacts.prototype.getFee = function (cb) {
	var message = {
		call: "contacts#getFee",
		args: {}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Contacts.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Contacts;