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
	private.applyUnconfirmedTransaction(transaction, function (err) {
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

private.applyUnconfirmedTransactionList = function (ids, cb) {
	async.eachSeries(ids, function (id, cb) {
		private.getUnconfirmedTransaction(id, function (err, transaction) {
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
		});
	}, cb);
}

private.getUnconfirmedTransaction = function (id, cb) {
	var index = private.unconfirmedTransactionsIdIndex[id];
	setImmediate(cb, null, private.unconfirmedTransactions[index]);
}

private.processUnconfirmedTransaction = function (transaction, cb) {
	function done(err) {
		if (err) {
			return cb(err);
		}

		private.addUnconfirmedTransaction(transaction, function (err) {
			if (err) {
				return cb(err);
			}

			modules.api.transport.message("transaction", transaction, cb);
		});
	}

	if (private.unconfirmedTransactionsIdIndex[transaction.id] !== undefined || private.doubleSpendingTransactions[transaction.id]) {
		return done("This transaction already exists");
	}

	modules.blockchain.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
		if (err) {
			return done(err);
		}

		async.series([
			function (cb) {
				modules.logic.transaction.process(transaction, sender, cb);
			},
			function (cb) {
				modules.logic.transaction.verify(transaction, sender, cb);
			}
		], done);
	});
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
			if (err) {
				return setImmediate(cb, err);
			}
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

Transactions.prototype.getUnconfirmedTransactionList = function (reverse, cb) {
	var a = [];
	for (var i = 0; i < private.unconfirmedTransactions.length; i++) {
		if (private.unconfirmedTransactions[i] !== false) {
			a.push(private.unconfirmedTransactions[i]);
		}
	}

	setImmediate(cb, null, reverse ? a.reverse() : a);
}

Transactions.prototype.onMessage = function (query) {
	switch (query.topic) {
		case "transaction":
			var transaction = query.message;
			private.processUnconfirmedTransaction(transaction, function (err) {
				console.log("processUnconfirmedTransaction", err)
			});
			break;
		case "balance":
			var executor = modules.blockchain.accounts.getExecutor();

			modules.api.transactions.getTransaction(query.message.transactionId, function (err, data) {
				if (!err && data.transaction && data.transaction.senderPublicKey == executor.keypair.publicKey) {
					modules.blockchain.accounts.setAccountAndGet({publicKey: executor.keypair.publicKey}, function (err, account) {
						var transaction = modules.logic.transaction.create({
							type: 1,
							sender: account,
							keypair: executor.keypair,
							amount: data.transaction.amount,
							src_id: data.transaction.id
						});
						private.processUnconfirmedTransaction(transaction, function (err) {
							console.log("processUnconfirmedTransaction", err)
						});
					});
				}
			});
			break;
	}
}

Transactions.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Transactions;