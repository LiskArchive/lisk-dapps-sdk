var extend = require('extend');
var util = require('util');
var crypto = require('crypto-browserify');
var bignum = require('browserify-bignum');

var private = {}, self = null,
	library = null, modules = null;

private.delegates = {};
private.u_delegates = {};

function Delegates(cb, _library) {
	self = this;
	library = _library;

	cb(null, self);
}

function applyDiff(source, diff) {
	var res = source ? source.slice() : [];

	for (var i = 0; i < diff.length; i++) {
		var math = diff[i][0];
		var val = diff[i].slice(1);

		if (math == "+") {
			res = res || [];

			var index = -1;
			if (res) {
				index = res.indexOf(val);
			}
			if (index != -1) {
				return false;
			}

			res.push(val);
		} else if (math == "-") {
			var index = -1;
			if (res) {
				index = res.indexOf(val);
			}
			if (index == -1) {
				return false;
			}
			res.splice(index, 1);
			if (!res.length) {
				res = null;
			}
		} else {
			return false;
		}
	}
	return res;
}

private.mergeDelegates = function (delegates, list, height, cb, scope) {
	var lastHeight = Math.max.apply(null, Object.keys(delegates));

	if (delegates[height]) {
		return cb("Delegate list exists")
	}

	try {
		var tmp_delegates = applyDiff(delegates[lastHeight], list);
	} catch (e) {
		return cb("wrong diff delegates" + e.toString());
	}

	if (!tmp_delegates) {
		return cb("wrong diff delegates");
	}
	delegates[height] = tmp_delegates;

	cb(null, delegates[height]);
}

private.undoLast = function (delegates, cb, scope) {
	var lastHeight = Math.max.apply(null, Object.keys(delegates));
	if (lastHeight == 1) {
		return cb("Genesis block is readonly")
	}
	delete delegates[lastHeight];
	lastHeight = Math.max.apply(null, Object.keys(delegates));

	cb(null, delegates[lastHeight]);
}

Delegates.prototype.getDelegates = function (height, cb, scope) {
	var tmpHeight = Object.keys((scope || private).delegates).reverse().find(function (currentHeight) {
		return height >= currentHeight;
	});
	cb(null, (scope || private).delegates[tmpHeight]);
}

Delegates.prototype.mergeDelegates = function (list, height, cb, scope) {
	var delegates = (scope || private).delegates;
	private.mergeDelegates(delegates, list, height, function (err, list) {
		if (!err) {
			!scope && library.bus.message("delegates", list);
		}
		cb(err);
	}, scope);
}

Delegates.prototype.mergeU_Delegates = function (list, height, cb, scope) {
	var delegates = (scope || private).u_delegates;
	private.mergeDelegates(delegates, list, height, cb, scope);
}

Delegates.prototype.undoLast = function (cb, scope) {
	var delegates = (scope || private).delegates;

	private.undoLast(delegates, function (err, list) {
		if (!err) {
			!scope && library.bus.message("delegates", list);
		}
		cb(err);
	}, scope);
}

Delegates.prototype.undoU_Last = function (cb, scope) {
	var delegates = (scope || private).u_delegates;

	private.undoLast(delegates, cb, scope);
}

Delegates.prototype.addDelegates = function (cb, query) {
	var keypair = modules.api.crypto.keypair(query.secret);

	library.sequence.add(function (cb) {
		modules.blockchain.accounts.getAccount({publicKey: keypair.publicKey.toString('hex')}, function (err, account) {
			if (err) {
				return cb(err.toString());
			}
			if (!account || !account.publicKey) {
				return cb("COMMON.OPEN_ACCOUNT");
			}

			try {
				var transaction = modules.logic.transaction.create({
					type: 4,
					sender: account,
					keypair: keypair,
					delegates: query.delegates
				});
			} catch (e) {
				return cb(e.toString());
			}

			modules.blockchain.transactions.processUnconfirmedTransaction(transaction, cb)
		});
	}, function (err, transaction) {
		if (err) {
			return cb(err.toString());
		}

		cb(null, {transaction: transaction});
	});
}

Delegates.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Delegates;