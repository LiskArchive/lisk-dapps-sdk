var util = require('util');
var async = require('async');
var constants = require('../helpers/constants.js');

var private = {}, self = null,
	library = null, modules = null;

function Delegates(cb, _library) {
	self = this;
	library = _library;

	cb(null, self);
}

Delegates.prototype.create = function (data, trs) {
	trs.recipientId = null;
	trs.amount = 0;

	trs.asset.delegates = {
		list: data.delegates
	}

	return trs;
}

Delegates.prototype.calculateFee = function (trs) {
	return 1 * constants.fixedPoint;
}

Delegates.prototype.getBytes = function (trs) {
	try {
		var buf = new Buffer(trs.asset.delegates.list.join(","), 'utf8');
	} catch (e) {
		throw Error(e.toString());
	}

	return buf;
}

Delegates.prototype.verify = function (trs, sender, cb, scope) {
	if (trs.recipientId) {
		return cb("TRANSACTIONS.INVALID_RECIPIENT");
	}

	if (trs.amount != 0) {
		return cb("TRANSACTIONS.INVALID_AMOUNT");
	}

	if (!trs.asset.delegates.list || !trs.asset.delegates.list.length) {
		return cb("TRANSACTIONS.EMPTY_DELEGATES");
	}

	modules.api.dapps.getGenesis(function (err, res) {
		if (trs.senderId != res.authorId) {
			return cb("TRANSACTIONS.DAPP_AUTHOR");
		} else {
			cb(null, trs);

		}
	});

}

Delegates.prototype.apply = function (trs, sender, cb, scope) {
	if (sender.balance < trs.fee) {
		return setImmediate(cb, "Balance has no XCR: " + trs.id);
	}

	async.series([
		function (cb) {
			var lastBlock = modules.blockchain.blocks.getLastBlock();
			modules.blockchain.delegates.mergeDelegates(trs.asset.delegates.list, lastBlock.height, cb, scope);
		},
		function (cb) {
			modules.blockchain.accounts.mergeAccountAndGet({
				address: sender.address,
				balance: -trs.fee
			}, cb, scope);
		}
	], cb);
}

Delegates.prototype.undo = function (trs, sender, cb, scope) {
	async.series([
		function (cb) {
			modules.blockchain.delegates.undoLast(cb, scope);
		},
		function (cb) {
			modules.blockchain.accounts.undoMerging({
				address: sender.address,
				balance: -trs.fee
			}, cb, scope);
		}
	], cb);
}

Delegates.prototype.applyUnconfirmed = function (trs, sender, cb, scope) {
	if (sender.u_balance < trs.fee) {
		return setImmediate(cb, 'Account has no balance: ' + trs.id);
	}

	async.series([
		function (cb) {
			var lastBlock = modules.blockchain.blocks.getLastBlock();
			modules.blockchain.delegates.mergeU_Delegates(trs.asset.delegates.list, lastBlock.height, cb, scope);
		},
		function (cb) {
			modules.blockchain.accounts.mergeAccountAndGet({
				address: sender.address,
				u_balance: -trs.fee
			}, cb, scope);
		}
	], cb);
}

Delegates.prototype.undoUnconfirmed = function (trs, sender, cb, scope) {
	async.series([
		function (cb) {
			modules.blockchain.delegates.undoU_Last(cb, scope);
		},
		function (cb) {
			modules.blockchain.accounts.undoMerging({
				address: sender.address,
				u_balance: -trs.fee
			}, cb, scope);
		}
	], cb);
}

Delegates.prototype.save = function (trs, cb) {
	modules.api.sql.insert({
		table: "asset_delegates",
		values: {
			delegates: trs.asset.delegates.list.join(","),
			transactionId: trs.id
		}
	}, cb);
}

Delegates.prototype.normalize = function (asset, cb) {
	return setImmediate(cb);
}

Delegates.prototype.ready = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

Delegates.prototype.dbRead = function (row) {
	if (!row.t_d_transactionId) {
		return null;
	}
	return {
		delegates: {
			list: row.t_d_delegates.split(",")
		}
	};
}

Delegates.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.logic.transaction.attachAssetType(4, self);
}

module.exports = Delegates;