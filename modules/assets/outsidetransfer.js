var private = {}, self = null,
	library = null, modules = null;

function OutsideTransfer(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

OutsideTransfer.prototype.create = function (data, trs) {
	trs.recipientId = null;
	trs.amount = data.amount;

	return trs;
}

OutsideTransfer.prototype.calculateFee = function (trs) {
	var fee = parseInt(trs.amount / 100 * 0.1);
	return fee || 1;
}

OutsideTransfer.prototype.verify = function (trs, sender, cb, scope) {
	if (trs.recipientId) {
		return cb("TRANSACTIONS.INVALID_RECIPIENT");
	}

	if (trs.amount <= 0) {
		return cb("TRANSACTIONS.INVALID_AMOUNT");
	}

	cb(null, trs);
}

OutsideTransfer.prototype.getBytes = function (trs) {
	return null;
}

OutsideTransfer.prototype.apply = function (trs, sender, cb, scope) {
	var sum = trs.amount + trs.fee;
	modules.blockchain.accounts.mergeAccountAndGet({
		address: sender.address,
		balance: -sum
	}, cb, scope);
}

OutsideTransfer.prototype.undo = function (trs, sender, cb, scope) {
	var sum = trs.amount + trs.fee;

	modules.blockchain.accounts.undoMerging({
		address: sender.address,
		balance: -sum
	}, cb, scope);
}

OutsideTransfer.prototype.applyUnconfirmed = function (trs, sender, cb, scope) {
	if (!sender || !sender.u_balance) {
		return cb("Sender doesn't have enough amount");
	}

	var sum = trs.amount + trs.fee;
	modules.blockchain.accounts.mergeAccountAndGet({
		address: sender.address,
		u_balance: -sum
	}, cb, scope);
}

OutsideTransfer.prototype.undoUnconfirmed = function (trs, sender, cb, scope) {
	var sum = trs.amount + trs.fee;
	modules.blockchain.accounts.undoMerging({
		address: sender.address,
		u_balance: -sum
	}, cb, scope);
}

OutsideTransfer.prototype.ready = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

OutsideTransfer.prototype.save = function (trs, cb) {
	setImmediate(cb);
}

OutsideTransfer.prototype.dbRead = function (row) {
	return null;
}

OutsideTransfer.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.logic.transaction.attachAssetType(2, self);
}

OutsideTransfer.prototype.withdrawal = function (cb, query) {
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
			},
			publicKey: {
				type: "string",
				format: "publicKey"
			}
		},
		required: ['secret', 'data', 'shared']
	}, function (err) {
		if (err) {
			return cb(err[0].message);
		}

		//finish api here
	});
}

module.exports = OutsideTransfer;