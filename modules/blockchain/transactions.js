var async = require('async');

var private = {}, self = null,
	library = null, modules = null;
private.unconfirmedTransactions = [];
private.unconfirmedTransactionsIdIndex = {};
private.doubleSpendingTransactions = {};

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
	if (query.topic == "transaction" || query.topic == "balance") {
		var transaction = null;
		if (query.topic == "balance") {
			var trs = {
				type: 1,
				senderId: query.message.recipientId,
				recipientId: query.message.recipientId,
				amount: query.message.amount,
				src_id: query.message.transactionId
			};
			transaction = modules.logic.transaction.create(transaction);
		} else {
			transaction = query.message;
		}
		private.processUnconfirmedTransaction(transaction, function (err) {
			console.log("processUnconfirmedTransaction", err)
		});
	}
}

Transactions.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Transactions;