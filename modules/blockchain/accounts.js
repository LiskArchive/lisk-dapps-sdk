var extend = require('extend');
var util = require('util');
var crypto = require('crypto-browserify');
var bignum = require('browserify-bignum');

var private = {}, self = null,
	library = null, modules = null;

private.accounts = [];
private.accountsIndexById = {};

function Accounts(cb, _library) {
	self = this;
	library = _library;

	cb(null, self);
}

function reverseDiff(diff) {
	var copyDiff = diff.slice();
	for (var i = 0; i < copyDiff.length; i++) {
		var math = copyDiff[i][0] == '-' ? '+' : '-';
		copyDiff[i] = math + copyDiff[i].slice(1);
	}
	return copyDiff;
}

function applyDiff(source, diff) {
	var res = source ? source.slice() : [];

	for (var i = 0; i < diff.length; i++) {
		var math = diff[i][0];
		var val = diff[i].slice(1);

		if (math == "+") {
			res = res || [];

			var index = -1;
			if (res) {
				index = res.indexOf(val);
			}
			if (index != -1) {
				return false;
			}

			res.push(val);
		}
		if (math == "-") {
			var index = -1;
			if (res) {
				index = res.indexOf(val);
			}
			if (index == -1) {
				return false;
			}
			res.splice(index, 1);
			if (!res.length) {
				res = null;
			}
		}
	}
	return res;
}

private.addAccount = function (account) {
	if (!account.address){
		account.address = self.generateAddressByPublicKey(account.publicKey);
	}
	private.accounts.push(account);
	var index = private.accounts.length - 1;
	private.accountsIndexById[account.address] = index;

	return account;
}

private.removeAccount = function (address) {
	var index = private.accountsIndexById[address];
	delete private.accountsIndexById[address];
	private.accounts[index] = undefined;
}

private.getAccount = function (address) {
	var index = private.accountsIndexById[address];
	return private.accounts[index];
}

Accounts.prototype.generateAddressByPublicKey = function (publicKey) {
	var publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
	var temp = new Buffer(8);
	for (var i = 0; i < 8; i++) {
		temp[i] = publicKeyHash[7 - i];
	}

	var address = bignum.fromBuffer(temp).toString() + "C";
	return address;
}

Accounts.prototype.getAccount = function (filter, cb) {
	var address = filter.address;
	if (filter.publicKey) {
		address = self.generateAddressByPublicKey(filter.publicKey);
	}
	if (!address) {
		return cb("must provide address or publicKey");
	}

	cb(null, private.getAccount(address));
}

Accounts.prototype.getAccounts = function (cb) {
	var result = private.accounts.filter(function (el) {
		if (!el) return false;
		return true;
	})
	cb(null, result);
}

Accounts.prototype.setAccountAndGet = function (data, cb) {
	var address = data.address || null;
	if (address === null) {
		if (data.publicKey) {
			address = self.generateAddressByPublicKey(data.publicKey);
		} else {
			return cb("must provide address or publicKey");
		}
	}
	var account = private.getAccount(address);

	if (!account){
		account = private.addAccount(data);
	}else{
		extend(account, data);
	}

	cb(null, account);
}

Accounts.prototype.mergeAccountAndGet = function (data, cb) {
	var address = data.address || null;
	if (address === null) {
		if (data.publicKey) {
			address = self.generateAddressByPublicKey(data.publicKey);
		} else {
			return cb("must provide address or publicKey");
		}
	}
	var account = private.getAccount(address);

	Object.keys(data).forEach(function (key) {
		var trueValue = data[key];
		if (typeof trueValue == "number") {
			account[value] = account[value] + trueValue;
		} else if (util.isArray(trueValue)) {
			account[value] = applyDiff(account[value], trueValue);
		}
	})

	cb(null, account);
}

Accounts.prototype.undoMerging = function (data, cb) {
	var address = data.address || null;
	if (address === null) {
		if (data.publicKey) {
			address = self.generateAddressByPublicKey(data.publicKey);
		} else {
			return cb("must provide address or publicKey");
		}
	}
	var account = private.getAccount(address);

	Object.keys(data).forEach(function (key) {
		var trueValue = data[key];
		if (typeof trueValue == "number") {
			account[value] = account[value] - trueValue;
		} else if (util.isArray(trueValue)) {
			trueValue = reverseDiff(trueValue);
			account[value] = applyDiff(account[value], trueValue);
		}
	})

	cb(null, account);
}

Accounts.prototype.onMessage = function (query) {
	if (query.topic == "balance") {
		var balance = query.message;
		modules.logic.accounts.setAccountAndGet({address: balance.address, balance: balance.value}, function (err, recipient) {
			modules.logic.accounts.mergeAccountAndGet({
				address: trs.recipientId,
				balance: trs.amount,
				u_balance: trs.amount
			}, function (err, account) {
				console.log("account", account)
			});
		});
	}
}

Accounts.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Accounts;