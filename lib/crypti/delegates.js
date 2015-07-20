/*
 Crypti delegates API calls
 */

var sandbox = null;

function Delegates(sandbox) {
	sandbox = sandbox;
}

Delegates.prototype.getDelegate = function (filter, cb) {
	var message = {
		call: "delegates#getDelegate",
		args: {
			transactionId: filter.transactionId,
			publicKey: filter.publicKey,
			username: filter.username
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Delegates.prototype.getDelegates = function (filter, cb) {
	var message = {
		call: "delegates#getDelegates",
		args: {
			limit: filter.limit,
			offset: filter.offset,
			orderBy: filter.orderBy
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Delegates.prototype.getFee = function (cb) {
	var message = {
		call: "delegates#getFee",
		args: {}
	};

	private.sandbox.sendMessage(message, cb);
}

Delegates.prototype.getForgedByAccount = function (generatorPublicKey, cb) {
	var message = {
		call: "delegates#getForgedByAccount",
		args: {
			generatorPublicKey: generatorPublicKey
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Delegates.prototype.enableForging = function (secret, publicKey, cb) {
	var message = {
		call: "delegates#enableForging",
		args: {
			secret: secret,
			publicKey: publicKey
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Delegates.prototype.disableForging = function (secret, publicKey, cb) {
	var message = {
		call: "delegates#disableForging",
		args: {
			secret: secret,
			publicKey: publicKey
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Delegates.prototype.statusForging = function (publicKey, cb) {
	var message = {
		call: "delegates#statusForging",
		args: {
			publicKey: publicKey
		}
	};

	private.sandbox.sendMessage(message, cb);
}

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

	private.sandbox.sendMessage(message, cb);
}

module.exports = Delegates;