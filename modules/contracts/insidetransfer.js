var async = require('async');
var constants = require('../helpers/constants.js');

var private = {}, self = null,
	library = null, modules = null;

function InsideTransfer(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

InsideTransfer.prototype.inheritance = function () {
	return InsideTransfer;
}

InsideTransfer.prototype.create = function (data, trs) {
	trs.recipientId = data.recipientId;
	trs.amount = data.amount;
	trs.token = data.token || trs.token;

	return trs;
}

InsideTransfer.prototype.calculateFee = function (trs) {
	return 0.1 * constants.fixedPoint;
}

InsideTransfer.prototype.verify = function (trs, sender, cb, scope) {
	var isAddress = /^[0-9]+[L|l]$/g;
	if (!isAddress.test(trs.recipientId.toLowerCase())) {
		return cb("TRANSACTIONS.INVALID_RECIPIENT");
	}

	if (trs.amount <= 0) {
		return cb("TRANSACTIONS.INVALID_AMOUNT");
	}

	if (trs.token != "LISK") {
		var tokenId = modules.contracts.token.findToken(trs.token);
		if (!tokenId) {
			return cb("Token doesn't exist");
		}
	}

	cb(null, trs);
}

InsideTransfer.prototype.getBytes = function (trs) {
	return null;
}

InsideTransfer.prototype.apply = function (trs, sender, cb, scope) {
	if (trs.token == "LISK") {
		if (sender.balance[trs.token] < trs.amount + trs.fee) {
			return setImmediate(cb, "Account has no LISK: " + trs.id);
		}
	} else {
		if (sender.balance[trs.token] < trs.amount) {
			return setImmediate(cb, "Account has no " + trs.token + ": " + trs.id);
		}
		if (sender.balance["LISK"] < trs.fee) {
			return setImmediate(cb, "Account has no LISK: " + trs.id);
		}
	}

	async.series([
		function (cb) {
			modules.blockchain.accounts.mergeAccountAndGet({
				address: sender.address,
				balance: {"LISK": -trs.fee}
			}, cb, scope);
		},
		function (cb) {
			var token = {};
			token[trs.token] = -trs.amount;

			modules.blockchain.accounts.mergeAccountAndGet({
				address: sender.address,
				balance: token
			}, cb, scope);
		},
		function (cb) {
			var token = {};
			token[trs.token] = trs.amount;

			modules.blockchain.accounts.mergeAccountAndGet({
				address: trs.recipientId,
				balance: token
			}, cb, scope);
		}
	], cb);
}

InsideTransfer.prototype.undo = function (trs, sender, cb, scope) {
	async.series([
		function (cb) {
			modules.blockchain.accounts.undoMerging({
				address: sender.address,
				balance: {"LISK": -trs.fee}
			}, cb, scope);
		},
		function (cb) {
			var token = {};
			token[trs.token] = -trs.amount;

			modules.blockchain.accounts.undoMerging({
				address: sender.address,
				balance: token
			}, cb, scope);
		},
		function (cb) {
			var token = {};
			token[trs.token] = trs.amount;

			modules.blockchain.accounts.undoMerging({
				address: trs.recipientId,
				balance: token
			}, cb, scope);
		}
	], cb);
}

InsideTransfer.prototype.applyUnconfirmed = function (trs, sender, cb, scope) {
	if (trs.token == "LISK") {
		if (sender.u_balance[trs.token] < trs.amount + trs.fee) {
			return setImmediate(cb, "Balance has no LISK: " + trs.id);
		}
	} else {
		if (sender.u_balance[trs.token] < trs.amount) {
			return setImmediate(cb, "Balance has no " + trs.token + ": " + trs.id);
		}
		if (sender.u_balance["LISK"] < trs.fee) {
			return setImmediate(cb, "Balance has no LISK: " + trs.id);
		}
	}

	async.series([
		function (cb) {
			modules.blockchain.accounts.mergeAccountAndGet({
				address: sender.address,
				u_balance: {"LISK": -trs.fee}
			}, cb, scope);
		},
		function (cb) {
			var token = {};
			token[trs.token] = -trs.amount;

			modules.blockchain.accounts.mergeAccountAndGet({
				address: sender.address,
				u_balance: token
			}, cb, scope);
		},
		function (cb) {
			var token = {};
			token[trs.token] = trs.amount;

			modules.blockchain.accounts.mergeAccountAndGet({
				address: trs.recipientId,
				u_balance: token
			}, cb, scope);
		}
	], cb);
}

InsideTransfer.prototype.undoUnconfirmed = function (trs, sender, cb, scope) {
	async.series([
		function (cb) {
			modules.blockchain.accounts.undoMerging({
				address: sender.address,
				u_balance: {"LISK": -trs.fee}
			}, cb, scope);
		},
		function (cb) {
			var token = {};
			token[trs.token] = -trs.amount;

			modules.blockchain.accounts.undoMerging({
				address: sender.address,
				u_balance: token
			}, cb, scope);
		},
		function (cb) {
			var token = {};
			token[trs.token] = trs.amount;

			modules.blockchain.accounts.undoMerging({
				address: trs.recipientId,
				u_balance: token
			}, cb, scope);
		}
	], cb);
}

InsideTransfer.prototype.ready = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

InsideTransfer.prototype.save = function (trs, cb) {
	setImmediate(cb);
}

InsideTransfer.prototype.dbRead = function (row) {
	return null;
}

InsideTransfer.prototype.normalize = function (asset, cb) {
	setImmediate(cb);
}

InsideTransfer.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.logic.transaction.attachAssetType(0, self);
}

module.exports = InsideTransfer;
