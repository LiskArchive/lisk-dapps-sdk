var private = {};
private.sandbox = null;

function Accounts(sandbox) {
	private.sandbox = sandbox;
}

Accounts.prototype.open = function (secret, cb) {
	var message = {
		call: "accounts#open",
		args: {
			secret: secret
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getBalance = function (address, cb) {
	var message = {
		call: "accounts#getBalance",
		args: {
			address: address
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getPublickey = function (address, cb) {
	var message = {
		call: "accounts#getPublickey",
		args: {
			address: address
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Accounts.prototype.generatePublickey = function (secret, cb) {
	var message = {
		call: "accounts#generatePublickey",
		args: {
			secret: secret
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getDelegates = function (address, cb) {
	var message = {
		call: "accounts#getDelegates",
		args: {
			address: address
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getDelegatesFee = function (cb) {
	var message = {
		call: "accounts#getDelegatesFee",
		args: {}
	};

	private.sandbox.sendMessage(message, cb);
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

	private.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getUsernameFee = function (cb) {
	var message = {
		call: "accounts#getUsernameFee",
		args: {}
	};

	private.sandbox.sendMessage(message, cb);
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

	private.sandbox.sendMessage(message, cb);
}

Accounts.prototype.getAccount = function (address, cb) {
	var message = {
		call: "accounts#getAccount",
		args: {
			address: address
		}
	};

	private.sandbox.sendMessage(message, cb);
}

module.exports = Accounts;