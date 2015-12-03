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

private.addUnconfirmedTransaction = function (transaction, cb, scope) {
	self.applyUnconfirmedTransaction(transaction, function (err) {
		if (err) {
			private.addDoubleSpending(transaction, function () {
				setImmediate(cb, err);
			}, scope);
		} else {
			(scope || private).unconfirmedTransactions.push(transaction);
			var index = (scope || private).unconfirmedTransactions.length - 1;
			(scope || private).unconfirmedTransactionsIdIndex[transaction.id] = index;

			setImmediate(cb);
		}
	}, scope);
}

private.applyTransactionList = function (transactions, cb, scope) {
	async.eachSeries(transactions, function (transaction, cb) {
		self.applyTransaction(transaction, function (err) {
			if (err) {
				return setImmediate(cb, err);
			}
			self.removeUnconfirmedTransaction(transaction.id, function () {
				setImmediate(cb, err);
			}, scope);
		}, scope);
	}, cb);
}

private.addDoubleSpending = function (transaction, cb, scope) {
	(scope || private).doubleSpendingTransactions[transaction.id] = transaction;
	setImmediate(cb);
}

Transactions.prototype.getUnconfirmedTransaction = function (id, cb, scope) {
	var index = (scope || private).unconfirmedTransactionsIdIndex[id];
	setImmediate(cb, null, (scope || private).unconfirmedTransactions[index]);
}

Transactions.prototype.undoUnconfirmedTransaction = function (transaction, cb, scope) {
	modules.blockchain.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
		if (err) {
			return setImmediate(cb, err);
		}
		modules.logic.transaction.undoUnconfirmed(transaction, sender, cb, scope);
	}, scope);
}

Transactions.prototype.undoTransaction = function (transaction, cb, scope) {
	modules.blockchain.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
		if (err) {
			return setImmediate(cb, err);
		}
		modules.logic.transaction.undo(transaction, sender, cb, scope);
	}, scope);
}

Transactions.prototype.processUnconfirmedTransaction = function (transaction, cb, scope) {
	function done(err) {
		if (err) {
			return cb(err);
		}

		private.addUnconfirmedTransaction(transaction, function (err) {
			if (err) {
				return cb(err);
			}

			!scope && modules.api.transport.message("transaction", transaction, function () {
				cb(null, {
					transactionId: transaction.id
				});
			});
		}, scope);
	}

	if ((scope || private).unconfirmedTransactionsIdIndex[transaction.id] !== undefined || (scope || private).doubleSpendingTransactions[transaction.id]) {
		return done("This transaction already exists");
	}

	var trsBytes = modules.logic.transaction.getBytes(transaction);
	transaction.id = modules.api.crypto.getId(trsBytes);

	modules.logic.transaction.normalize(transaction, function (err) {
		if (err) {
			return done(err);
		}

		modules.blockchain.accounts.setAccountAndGet({publicKey: transaction.senderPublicKey}, function (err, sender) {
			if (err) {
				return done(err);
			}
			async.series([
				function (cb) {
					modules.logic.transaction.process(transaction, sender, cb);
				},
				function (cb) {
					modules.logic.transaction.verify(transaction, sender, cb, scope);
				}
			], done);
		}, scope);
	});
}

Transactions.prototype.applyTransaction = function (transaction, cb, scope) {
	modules.blockchain.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
		if (err) {
			return setImmediate(cb, err);
		}

		modules.logic.transaction.apply(transaction, sender, cb, scope);
	}, scope);
}

Transactions.prototype.applyUnconfirmedTransaction = function (transaction, cb, scope) {
	modules.blockchain.accounts.setAccountAndGet({publicKey: transaction.senderPublicKey}, function (err, sender) {
		if (err) {
			return setImmediate(cb, err);
		}
		if (!sender) {
			return cb('Failed account: ' + transaction.id);
		} else {
			modules.logic.transaction.applyUnconfirmed(transaction, sender, cb, scope);
		}
	}, scope);
}

Transactions.prototype.getUnconfirmedTransactionList = function (reverse, cb, scope) {
	var a = [];
	for (var i = 0; i < (scope || private).unconfirmedTransactions.length; i++) {
		if ((scope || private).unconfirmedTransactions[i] !== false) {
			a.push((scope || private).unconfirmedTransactions[i]);
		}
	}

	setImmediate(cb, null, reverse ? a.reverse() : a);
}

Transactions.prototype.removeUnconfirmedTransaction = function (id, cb, scope) {
	var index = (scope || private).unconfirmedTransactionsIdIndex[id];
	delete (scope || private).unconfirmedTransactionsIdIndex[id];
	(scope || private).unconfirmedTransactions[index] = false;
	setImmediate(cb);
}

Transactions.prototype.addTransaction = function (cb, query) {
	var keypair = modules.api.crypto.keypair(query.secret);

	library.sequence.add(function (cb) {
		modules.blockchain.accounts.setAccountAndGet({address: query.recipientId}, function (err, recipient) {
			if (err) {
				return cb(err.toString());
			}
			modules.blockchain.accounts.getAccount({publicKey: keypair.publicKey.toString('hex')}, function (err, account) {
				if (err) {
					return cb(err.toString());
				}
				if (!account || !account.publicKey) {
					return cb("COMMON.OPEN_ACCOUNT");
				}

				try {
					var transaction = modules.logic.transaction.create({
						type: 0,
						amount: query.amount,
						sender: account,
						recipientId: query.recipientId,
						token: query.token,
						keypair: keypair
					});
				} catch (e) {
					return cb(e.toString());
				}

				self.processUnconfirmedTransaction(transaction, cb)
			});
		});
	}, function (err, transaction) {
		if (err) {
			return cb(err.toString());
		}

		cb(null, {transaction: transaction});
	});
}

Transactions.prototype.getTransactions = function (cb, query) {
	self.getUnconfirmedTransactionList(false, cb)
}

Transactions.prototype.onMessage = function (query) {
	switch (query.topic) {
		case "transaction":
			library.sequence.add(function (cb) {
				var transaction = query.message;
				self.processUnconfirmedTransaction(transaction, function (err) {
					if (err) {
						library.logger("processUnconfirmedTransaction error", err)
					}
					cb(err);
				});
			});
			break;
	}
}

Transactions.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Transactions;