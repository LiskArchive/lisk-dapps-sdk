var private = {}, self = null,
	library = null, modules = null;

function InsideTransfer(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

InsideTransfer.prototype.create = function (data, trs) {
	trs.recipientId = data.recipientId;
	trs.amount = data.amount;

	return trs;
}

InsideTransfer.prototype.calculateFee = function (trs) {
	var fee = parseInt(trs.amount / 100 * 0.1);
	return fee || 1;
}

InsideTransfer.prototype.verify = function (trs, sender, cb) {
	var isAddress = /^[0-9]+[C|c]$/g;
	if (!isAddress.test(trs.recipientId.toLowerCase())) {
		return cb(errorCode("TRANSACTIONS.INVALID_RECIPIENT", trs));
	}

	if (trs.amount <= 0) {
		return cb(errorCode("TRANSACTIONS.INVALID_AMOUNT", trs));
	}

	cb(null, trs);
}

InsideTransfer.prototype.getBytes = function (trs) {
	return null;
}

InsideTransfer.prototype.apply = function (trs, sender, cb) {
	modules.blockchain.accounts.mergeAccountAndGet({
		address: trs.recipientId,
		balance: trs.amount,
		u_balance: trs.amount
	}, cb);
}

InsideTransfer.prototype.undo = function (trs, sender, cb) {
	modules.blockchain.accounts.undoMerging({
		address: trs.recipientId,
		balance: trs.amount,
		u_balance: trs.amount
	}, cb);
}

InsideTransfer.prototype.applyUnconfirmed = function (trs, sender, cb) {
	setImmediate(cb);
}

InsideTransfer.prototype.undoUnconfirmed = function (trs, sender, cb) {
	setImmediate(cb);
}

InsideTransfer.prototype.save = function (cb) {
	setImmediate(cb);
}

InsideTransfer.prototype.dbRead = function (row) {
	return null;
}

InsideTransfer.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.logic.transaction.attachAssetType(0, self);
}

module.exports = InsideTransfer;