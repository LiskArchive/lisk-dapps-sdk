var private = {}, self = null,
library = null, modules = null;

function Accounts(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Accounts.prototype.open = function (secret, cb) {
	var message = {
		call: "accounts#open",
		args: {
			secret: secret
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getBalance = function (address, cb) {
	var message = {
		call: "accounts#getBalance",
		args: {
			address: address
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getPublickey = function (address, cb) {
	var message = {
		call: "accounts#getPublickey",
		args: {
			address: address
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.generatePublickey = function (secret, cb) {
	var message = {
		call: "accounts#generatePublickey",
		args: {
			secret: secret
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getDelegates = function (address, cb) {
	var message = {
		call: "accounts#getDelegates",
		args: {
			address: address
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getDelegatesFee = function (cb) {
	var message = {
		call: "accounts#getDelegatesFee",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
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

	library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getUsernameFee = function (cb) {
	var message = {
		call: "accounts#getUsernameFee",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
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

	library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getAccount = function (address, cb) {
	var message = {
		call: "accounts#getAccount",
		args: {
			address: address
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Accounts.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Accounts;