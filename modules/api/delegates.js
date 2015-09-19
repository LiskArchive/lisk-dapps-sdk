/*
 Crypti delegates API calls
 */

var private = {}, self = null,
library = null, modules = null;

function Delegates(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
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

	library.sandbox.sendMessage(message, cb);
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

	library.sandbox.sendMessage(message, cb);
}

Delegates.prototype.getFee = function (cb) {
	var message = {
		call: "delegates#getFee",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Delegates.prototype.getForgedByAccount = function (generatorPublicKey, cb) {
	var message = {
		call: "delegates#getForgedByAccount",
		args: {
			generatorPublicKey: generatorPublicKey
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Delegates.prototype.enableForging = function (secret, publicKey, cb) {
	var message = {
		call: "delegates#enableForging",
		args: {
			secret: secret,
			publicKey: publicKey
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Delegates.prototype.disableForging = function (secret, publicKey, cb) {
	var message = {
		call: "delegates#disableForging",
		args: {
			secret: secret,
			publicKey: publicKey
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Delegates.prototype.statusForging = function (publicKey, cb) {
	var message = {
		call: "delegates#statusForging",
		args: {
			publicKey: publicKey
		}
	};

	library.sandbox.sendMessage(message, cb);
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

	library.sandbox.sendMessage(message, cb);
}

Delegates.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Delegates;