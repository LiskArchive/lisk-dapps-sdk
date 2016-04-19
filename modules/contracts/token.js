var util = require("util");
var async = require("async");
var constants = require("../helpers/constants.js");

var private = {}, self = null,
	library = null, modules = null;

private.tokens = {}, private.u_tokens = [];

function Token(cb, _library) {
	self = this;
	library = _library;

	cb(null, self);
}

Token.prototype.create = function (data, trs) {
	trs.recipientId = null;
	trs.amount = 0;

	trs.asset.token = {
		name: data.name,
		description: data.description,
		fund: data.fund
	}

	return trs;
}

Token.prototype.calculateFee = function (trs) {
	return 1 * constants.fixedPoint;
}

Token.prototype.getBytes = function (trs) {
	try {
		var buf = new Buffer(trs.asset.token.name + trs.asset.token.description + trs.asset.token.fund, "utf8");
	} catch (e) {
		throw Error(e.toString());
	}

	return buf;
}

Token.prototype.verify = function (trs, sender, cb, scope) {
	if (trs.recipientId) {
		return cb("Invalid recipient");
	}
	if (trs.amount != 0) {
		return cb("Invalid transaction amount");
	}
	if (!trs.asset.token.name) {
		return cb("Invalid token name");
	}
	if (trs.asset.token.name.length > 16) {
		return cb("Token name must be 16 characters or less");
	}
	if (!trs.asset.token.description) {
		return cb("Invalid token description");
	}
	if (typeof trs.asset.token.fund != "number") {
		return cb("Invalid tokek fund");
	}

	var isToken = /^[A-Z]+$/g;
	if (!isToken.test(trs.asset.token.name)){
		return setImmediate(cb, "Invalid token name");
	}

	cb(null, trs);
}

Token.prototype.apply = function (trs, sender, cb, scope) {
	delete private.u_tokens[trs.asset.token.name];
	private.tokens[trs.asset.token.name] = trs.id;

	if (sender.balance["LISK"] < trs.fee) {
		return setImmediate(cb, "Account does not have enouh LISK: " + trs.id);
	}

	async.series([
		function (cb) {
			var token = {};
			token[trs.asset.token.name] = trs.asset.token.fund;

			modules.blockchain.accounts.mergeAccountAndGet({
				address: sender.address,
				balance: token
			}, cb, scope);
		},
		function (cb) {
			modules.blockchain.accounts.mergeAccountAndGet({
				address: sender.address,
				balance: {"LISK": -trs.fee}
			}, cb, scope);
		}
	], cb);
}

Token.prototype.undo = function (trs, sender, cb, scope) {
	delete private.tokens[trs.asset.token.name];
	private.u_tokens[trs.asset.token.name] = trs.id;

	async.series([
		function (cb) {
			var token = {};
			token[trs.asset.token.name] = trs.asset.token.fund;

			modules.blockchain.accounts.undoMerging({
				address: sender.address,
				balance: token
			}, cb, scope);
		},
		function (cb) {
			modules.blockchain.accounts.undoMerging({
				address: sender.address,
				balance: {"LISK": -trs.fee}
			}, cb, scope);
		}
	], cb);
}

Token.prototype.applyUnconfirmed = function (trs, sender, cb, scope) {
	if (sender.u_balance["LISK"] < trs.fee) {
		return setImmediate(cb, "Account does not have enough LISK: " + trs.id);
	}

	if (private.u_tokens[trs.asset.token.name] || private.tokens[trs.asset.token.name]){
		return setImmediate(cb, "Token already exists: " + trs.id);
	}

	private.u_tokens[trs.asset.token.name] = trs.id;

	async.series([
		function (cb) {
			var token = {};
			token[trs.asset.token.name] = trs.asset.token.fund;

			modules.blockchain.accounts.mergeAccountAndGet({
				address: sender.address,
				u_balance: token
			}, cb, scope);
		},
		function (cb) {
			modules.blockchain.accounts.mergeAccountAndGet({
				address: sender.address,
				u_balance: {"LISK": -trs.fee}
			}, cb, scope);
		}
	], cb);
}

Token.prototype.undoUnconfirmed = function (trs, sender, cb, scope) {
	delete private.u_tokens[trs.asset.token.name];

	async.series([
		function (cb) {
			var token = {};
			token[trs.asset.token.name] = trs.asset.token.fund;

			modules.blockchain.accounts.undoMerging({
				address: sender.address,
				u_balance: token
			}, cb, scope);
		},
		function (cb) {
			modules.blockchain.accounts.undoMerging({
				address: sender.address,
				u_balance: {"LISK": -trs.fee}
			}, cb, scope);
		}
	], cb);
}

Token.prototype.save = function (trs, cb) {
	modules.api.sql.insert({
		table: "asset_token",
		values: {
			name: trs.asset.token.name,
			description: trs.asset.token.description,
			fund: trs.asset.token.fund,
			transactionId: trs.id
		}
	}, cb);
}

Token.prototype.normalize = function (asset, cb) {
	return setImmediate(cb);
}

Token.prototype.ready = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

Token.prototype.dbRead = function (row) {
	if (!row.t_t_transactionId) {
		return null;
	}
	return {
		token: {
			name: row.t_t_name,
			description: row.t_t_description,
			fund: row.t_t_fund
		}
	};
}

Token.prototype.findToken = function (name) {
	return private.tokens[name];
}

Token.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.logic.transaction.attachAssetType(5, self);
}

module.exports = Token;
