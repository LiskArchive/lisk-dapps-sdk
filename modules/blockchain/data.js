var async = require('async');

var private = {}, self = null;
private.library = null;
private.modules = null;
private.unconfirmedTransactions = [];
private.unconfirmedTransactionsIdIndex = {};
private.doubleSpendingTransactions = {};

function Data(cb, library) {
	self = this;

	private.library = library;
	cb(null, this);
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

private.getUnconfirmedTransactionList = function (reverse, cb) {
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
			private.applyTransaction(transaction, cb);
		},
		function (cb) {
			private.modules.transport.message("transactions", transaction, cb);
		}
	], cb);


	// processUnconfirmedTransaction
}

private.applyUnconfirmedTransaction = function (transaction, cb) {
	// applyUnconfirmedTransaction
}

private.undoUnconfirmedTransaction = function (transaction, cb) {
	// undoUnconfirmedTransaction
}

private.removeUnconfirmedTransaction = function (id, cb) {
	var index = private.unconfirmedTransactionsIdIndex[id];
	delete private.unconfirmedTransactionsIdIndex[id];
	private.unconfirmedTransactions[index] = false;
}

private.applyTransaction = function (transaction, cb) {

}

private.undoTransaction = function (transaction, cb) {

}

private.applyTransactionList = function (transactions, cb) {
	async.eachSeries(transactions, function (transaction, cb) {
		private.applyTransaction(transaction, function (err) {
			private.removeUnconfirmedTransaction(transaction.id);
			setImmediate(cb, err);
		});
	}, cb);
}

private.addDoubleSpending = function (transaction, cb) {
	private.doubleSpendingTransactions[transaction.id] = transaction;
	setImmediate(cb);
}

Data.prototype.onMessage = function (query) {
	if (query.topic == "transactions") {
		async.eachSeries(query.message, function (transaction, cb) {
			private.processUnconfirmedTransaction(transaction, cb);
		}, function (err) {
			cb(err, transactions);
		});
	}
}

Data.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Data;