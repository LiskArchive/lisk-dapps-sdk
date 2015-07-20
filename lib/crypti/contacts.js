/*
 Crypti contacts API calls
 */

var sandbox = null;

function Contacts(sandbox) {
	sandbox = sandbox;
}

Contacts.prototype.getContacts = function (publicKey, cb) {
	var message = {
		call: "contacts#getContacts",
		args: {
			publicKey: publicKey
		}
	};

	private.sandbox.sendMessage(message, cb);
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

	private.sandbox.sendMessage(message, cb);
}

Contacts.prototype.getHeight = function (cb) {
	var message = {
		call: "contacts#getHeight",
		args: {}
	};

	private.sandbox.sendMessage(message, cb);
}

Contacts.prototype.getFee = function (cb) {
	var message = {
		call: "contacts#getFee",
		args: {}
	};

	private.sandbox.sendMessage(message, cb);
}

module.exports = Contacts;