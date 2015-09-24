var util = require('util');
var Insidetransfer = require('./insidetransfer.js');

var private = {}, self = null,
	library = null, modules = null;

function MyAsset(cb, _library) {
	self = this;
	library = _library;

	cb(null, self);
}

MyAsset.prototype.create = function (data, trs) {
	trs = MyAsset.super_.prototype.create.call(self, data, trs);

	return trs;
}

MyAsset.prototype.getBytes = function (trs) {
	try {
		var buf = new Buffer(trs.asset.myasset.text, 'utf8');
	} catch (e) {
		throw Error(e.toString());
	}

	return buf;
}

MyAsset.prototype.verify = function (trs, sender, cb, scope) {
	MyAsset.super_.prototype.verify.call(self, trs, sender, function (err, trs) {
		if (err) {
			return cb(err);
		}
		if (!trs.asset.myasset.text) {
			return cb("TRANSACTIONS.EMPTY_TEXT");
		}
		cb(null, trs)
	}, scope);
}

MyAsset.prototype.save = function (trs, cb) {
	modules.api.sql.insert({
		table: "asset_myasset",
		values: {
			text: trs.asset.myasset.text,
			transactionId: trs.id
		}
	}, cb);
}

MyAsset.prototype.normalize = function (asset, cb) {
	return setImmediate(cb);
}

MyAsset.prototype.dbRead = function (row) {
	if (!row.t_ma_transactionId) {
		return null;
	}
	return {
		myasset: {
			text: row.t_ma_text
		}
	};
}

MyAsset.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.logic.transaction.attachAssetType(3, self);
}

util.inherits(MyAsset, Insidetransfer);

module.exports = MyAsset;