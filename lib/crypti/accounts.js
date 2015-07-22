var private = {};
private.library = null;
private.modules = null;

function Accounts(cb, library) {
	private.library = library;
	cb(null, this);
}

Accounts.prototype.open = function (secret, cb) {
	var message = {
		call: "accounts#open",
		args: {
			secret: secret
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getBalance = function (address, cb) {
	var message = {
		call: "accounts#getBalance",
		args: {
			address: address
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getPublickey = function (address, cb) {
	var message = {
		call: "accounts#getPublickey",
		args: {
			address: address
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.generatePublickey = function (secret, cb) {
	var message = {
		call: "accounts#generatePublickey",
		args: {
			secret: secret
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getDelegates = function (address, cb) {
	var message = {
		call: "accounts#getDelegates",
		args: {
			address: address
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getDelegatesFee = function (cb) {
	var message = {
		call: "accounts#getDelegatesFee",
		args: {}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.addDelegates = function (secret, publicKey, secondSecret, cb) {
	var message = {
		call: "accounts#addDelegates",
		args: {
			secret: secret,
			publicKey: publicKey,
			secondSecret: secondSecret
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getUsernameFee = function (cb) {
	var message = {
		call: "accounts#getUsernameFee",
		args: {}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.addUsername = function (secret, publicKey, secondSecret, username, cb) {
	var message = {
		call: "accounts#addUsername",
		args: {
			secret: secret,
			publicKey: publicKey,
			secondSecret: secondSecret,
			username: username
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getAccount = function (address, cb) {
	var message = {
		call: "accounts#getAccount",
		args: {
			address: address
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

module.exports = Accounts;