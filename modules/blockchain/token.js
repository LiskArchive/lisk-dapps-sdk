var extend = require('extend');
var util = require('util');
var crypto = require('crypto-browserify');
var bignum = require('browserify-bignum');

var private = {}, self = null,
	library = null, modules = null;

function Token(cb, _library) {
	self = this;
	library = _library;

	cb(null, self);
}

Token.prototype.addToken = function (cb, query) {
	var keypair = modules.api.crypto.keypair(query.secret);

	library.sequence.add(function (cb) {
		modules.blockchain.accounts.getAccount({publicKey: keypair.publicKey.toString('hex')}, function (err, account) {
			if (err) {
				return cb(err.toString());
			}
			if (!account || !account.publicKey) {
				return cb("COMMON.OPEN_ACCOUNT");
			}

			try {
				var transaction = modules.logic.transaction.create({
					type: 5,
					sender: account,
					keypair: keypair,
					name: query.name,
					description: query.description,
					fund: query.fund,
				});
			} catch (e) {
				return cb(e.toString());
			}

			modules.blockchain.transactions.processUnconfirmedTransaction(transaction, cb)
		});
	}, function (err, transaction) {
		if (err) {
			return cb(err.toString());
		}

		cb(null, {transaction: transaction});
	});
}

Token.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Token;