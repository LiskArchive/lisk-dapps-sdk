var async = require('async');

var private = {}, self = null,
	library = null, modules = null;
private.unconfirmedTransactions = [];
private.unconfirmedTransactionsIdIndex = {};
private.doubleSpendingTransactions = {};

function InsideTransfer() {
	this.create = function (data, trs) {
		trs.recipientId = data.recipientId;
		trs.recipientUsername = data.recipientUsername;
		trs.amount = data.amount;

		return trs;
	}

	this.calculateFee = function (trs) {
		var fee = parseInt(trs.amount / 100 * 0.1);
		return fee || 1;
	}

	this.verify = function (trs, sender, cb) {
		var isAddress = /^[0-9]+[C|c]$/g;
		if (!isAddress.test(trs.recipientId.toLowerCase())) {
			return cb(errorCode("TRANSACTIONS.INVALID_RECIPIENT", trs));
		}

		if (trs.amount <= 0) {
			return cb(errorCode("TRANSACTIONS.INVALID_AMOUNT", trs));
		}

		cb(null, trs);
	}

	this.process = function (trs, sender, cb) {
		setImmediate(cb, null, trs);
	}

	this.getBytes = function (trs) {
		return null;
	}

	this.apply = function (trs, sender, cb) {
		modules.blockchain.accounts.mergeAccountAndGet({
			address: trs.recipientId,
			balance: trs.amount,
			u_balance: trs.amount
		}, cb);
	}

	this.undo = function (trs, sender, cb) {
		modules.blockchain.accounts.undoMerging({
			address: trs.recipientId,
			balance: trs.amount,
			u_balance: trs.amount
		}, cb);
	}

	this.applyUnconfirmed = function (trs, sender, cb) {
		setImmediate(cb);
	}

	this.undoUnconfirmed = function (trs, sender, cb) {
		setImmediate(cb);
	}

	this.save = function (cb) {
		setImmediate(cb);
	}
}

function OutsideTransfer() {
	this.create = function (data, trs) {
		trs.recipientId = data.recipientId;
		trs.recipientUsername = data.recipientUsername;
		trs.amount = data.amount;

		return trs;
	}

	this.calculateFee = function (trs) {
		var fee = parseInt(trs.amount / 100 * 0.1);
		return fee || 1;
	}

	this.verify = function (trs, sender, cb) {
		var isAddress = /^[0-9]+[C|c]$/g;
		if (!isAddress.test(trs.recipientId.toLowerCase())) {
			return cb(errorCode("TRANSACTIONS.INVALID_RECIPIENT", trs));
		}

		if (trs.amount <= 0) {
			return cb(errorCode("TRANSACTIONS.INVALID_AMOUNT", trs));
		}

		cb(null, trs);
	}

	this.process = function (trs, sender, cb) {
		setImmediate(cb, null, trs);
	}

	this.getBytes = function (trs) {
		return null;
	}

	this.apply = function (trs, sender, cb) {
		modules.blockchain.accounts.mergeAccountAndGet({
			address: trs.recipientId,
			balance: trs.amount,
			u_balance: trs.amount
		}, cb);
	}

	this.undo = function (trs, sender, cb) {
		modules.blockchain.accounts.undoMerging({
			address: trs.recipientId,
			balance: trs.amount,
			u_balance: trs.amount
		}, cb);
	}

	this.applyUnconfirmed = function (trs, sender, cb) {
		setImmediate(cb);
	}

	this.undoUnconfirmed = function (trs, sender, cb) {
		setImmediate(cb);
	}

	this.save = function (cb) {
		modules.api.sql.insert({
			table: "asset_dapptransfer",
			values: {
				senderId: trs.senderId,
				amount: trs.amount,
				src_id: trs.src_id,
				src_height: trs.src_height,
				transactionId: trs.transactionId
			}
		}, cb);
	}
}


function Transactions(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

private.addUnconfirmedTransaction = function (transaction, cb) {
	private.applyUnconfirmed(transaction, function (err) {
		if (err) {
			private.addDoubleSpending(transaction, function () {
				setImmediate(cb, err);
			});
		} else {
			private.unconfirmedTransactions.push(transaction);
			var index = private.unconfirmedTransactions.length - 1;
			private.unconfirmedTransactionsIdIndex[transaction.id] = index;

			setImmediate(cb);
		}
	});
}

Transactions.prototype.getUnconfirmedTransactionList = function (reverse, cb) {
	var a = [];
	for (var i = 0; i < private.unconfirmedTransactions.length; i++) {
		if (private.unconfirmedTransactions[i] !== false) {
			a.push(private.unconfirmedTransactions[i]);
		}
	}

	setImmediate(cb, null, reverse ? a.reverse() : a);
}

private.applyUnconfirmedTransactionList = function (ids, cb) {
	async.eachSeries(ids, function (id, cb) {
		var transaction = private.getUnconfirmedTransaction(id);
		private.applyUnconfirmed(transaction, function (err) {
			if (err) {
				async.series([
					function (cb) {
						private.removeUnconfirmedTransaction(id, cb);
					},
					function (cb) {
						private.addDoubleSpending(transaction, cb);
					}
				], cb);
			} else {
				setImmediate(cb);
			}
		});
	}, cb);
}

private.getUnconfirmedTransaction = function (id, cb) {
	var index = private.unconfirmedTransactionsIdIndex[id];
	setImmediate(cb, null, private.unconfirmedTransactions[index]);
}

private.processUnconfirmedTransaction = function (transaction, cb) {
	if (private.unconfirmedTransactionsIdIndex[transaction.id] !== undefined || private.doubleSpendingTransactions[transaction.id]) {
		return cb("This transaction already exists");
	}

	async.series([
		function (cb) {
			private.applyUnconfirmedTransaction(transaction, cb);
		},
		function (cb) {
			modules.api.transport.message("transaction", transaction, cb);
		}
	], cb);

	// processUnconfirmedTransaction
}

private.applyUnconfirmedTransaction = function (transaction, cb) {
	modules.blockchain.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
		if (err) {
			return setImmediate(cb, err);
		}
		if (!sender) {
			return cb('Failed account: ' + transaction.id);
		} else {
			modules.logic.transaction.applyUnconfirmed(transaction, sender, cb);
		}
	});
}

private.undoUnconfirmedTransaction = function (transaction, cb) {
	modules.blockchain.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
		if (err) {
			return setImmediate(cb, err);
		}
		modules.logic.transaction.undoUnconfirmed(transaction, sender, cb);
	});
}

private.removeUnconfirmedTransaction = function (id, cb) {
	var index = private.unconfirmedTransactionsIdIndex[id];
	delete private.unconfirmedTransactionsIdIndex[id];
	private.unconfirmedTransactions[index] = false;
}

private.applyTransaction = function (transaction, cb) {
	modules.blockchain.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
		if (err) {
			return setImmediate(cb, err);
		}
		modules.logic.transaction.apply(transaction, sender, cb);
	});
}

private.undoTransaction = function (transaction, cb) {
	modules.blockchain.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
		if (err) {
			return setImmediate(cb, err);
		}
		modules.logic.transaction.undo(transaction, sender, cb);
	});
}

private.applyTransactionList = function (transactions, cb) {
	async.eachSeries(transactions, function (transaction, cb) {
		private.applyTransaction(transaction, function (err) {
			private.removeUnconfirmedTransaction(transaction.id, function () {
				setImmediate(cb, err);
			});
		});
	}, cb);
}

private.addDoubleSpending = function (transaction, cb) {
	private.doubleSpendingTransactions[transaction.id] = transaction;
	setImmediate(cb);
}

Transactions.prototype.onMessage = function (query) {
	if (query.topic == "transaction") {
		var transaction = query.message;
		private.processUnconfirmedTransaction(transaction, function (err) {
			console.log("processUnconfirmedTransaction", err)

		});
	}
}

Transactions.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.logic.transaction.attachAssetType(0, new InsideTransfer());

	modules.logic.transaction.attachAssetType(1, new OutsideTransfer());
}

module.exports = Transactions;