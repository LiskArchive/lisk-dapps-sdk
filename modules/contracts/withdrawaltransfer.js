var constants = require("../helpers/constants.js");

var private = {}, self = null,
	library = null, modules = null;

function WithdrawalTransfer(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

WithdrawalTransfer.prototype.create = function (data, trs) {
	trs.recipientId = null;
	trs.amount = data.amount;
	return trs;
}

WithdrawalTransfer.prototype.calculateFee = function (trs) {
	return 0.1 * constants.fixedPoint;
}

WithdrawalTransfer.prototype.verify = function (trs, sender, cb, scope) {
	if (trs.recipientId) {
		return cb("Invalid recipient");
	}

	if (trs.amount <= 0) {
		return cb("Invalid transaction amount");
	}

	cb(null, trs);
}

WithdrawalTransfer.prototype.getBytes = function (trs) {
	return null;
}

WithdrawalTransfer.prototype.apply = function (trs, sender, cb, scope) {
	modules.blockchain.accounts.mergeAccountAndGet({
		address: sender.address,
		balance: {"LISK": -(trs.amount + trs.fee)}
	}, cb, scope);
}

WithdrawalTransfer.prototype.undo = function (trs, sender, cb, scope) {
	modules.blockchain.accounts.undoMerging({
		address: sender.address,
		balance: {"LISK": -(trs.amount + trs.fee)}
	}, cb, scope);
}

WithdrawalTransfer.prototype.applyUnconfirmed = function (trs, sender, cb, scope) {
	var sum = trs.amount + trs.fee;

	if (sender.u_balance["LISK"] < sum) {
		return cb("Account does not have enough LISK");
	}

	modules.blockchain.accounts.mergeAccountAndGet({
		address: sender.address,
		u_balance: {"LISK": -(trs.amount + trs.fee)}
	}, cb, scope);
}

WithdrawalTransfer.prototype.undoUnconfirmed = function (trs, sender, cb, scope) {
	modules.blockchain.accounts.undoMerging({
		address: sender.address,
		u_balance: {"LISK": -(trs.amount + trs.fee)}
	}, cb, scope);
}

WithdrawalTransfer.prototype.ready = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

WithdrawalTransfer.prototype.normalize = function (asset, cb) {
	setImmediate(cb);
}

WithdrawalTransfer.prototype.save = function (trs, cb) {
	setImmediate(cb);
}

WithdrawalTransfer.prototype.dbRead = function (row) {
	return null;
}

WithdrawalTransfer.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.logic.transaction.attachAssetType(2, self);
}

WithdrawalTransfer.prototype.withdrawal = function (cb, query) {
	library.validator.validate(query, {
		type: "object",
		properties: {
			secret: {
				type: "string",
				minLength: 1,
				maxLength: 100
			},
			amount: {
				type: "integer",
				minimum: 1
			}
		},
	}, function (err) {
		if (err) {
			return cb(err[0].message);
		}

		var keypair = modules.api.crypto.keypair(query.secret);

		var account = modules.blockchain.accounts.getAccount({
			publicKey: keypair.publicKey.toString("hex")
		}, function (err, account) {
			try {
				var transaction = library.modules.logic.transaction.create({
					type: 2,
					amount: query.amount,
					sender: account,
					keypair: keypair
				});
			} catch (e) {
				return setImmediate(cb, e.toString(0));
			}

			modules.blockchain.transactions.processUnconfirmedTransaction(transaction, cb);
		});
	})
}

module.exports = WithdrawalTransfer;
