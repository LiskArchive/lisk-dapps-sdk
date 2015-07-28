/*
 Crypti contacts API calls
 */

var private = {};
var library = null;
var modules = null;

function Contacts(cb, _library) {
	library = _library;
	cb(null, this);
}

Contacts.prototype.getContacts = function (publicKey, cb) {
	var message = {
		call: "contacts#getContacts",
		args: {
			publicKey: publicKey
		}
	};

	library.sandbox.sendMessage(message, cb);
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

	library.sandbox.sendMessage(message, cb);
}

Contacts.prototype.getHeight = function (cb) {
	var message = {
		call: "contacts#getHeight",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Contacts.prototype.getFee = function (cb) {
	var message = {
		call: "contacts#getFee",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Contacts.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Contacts;