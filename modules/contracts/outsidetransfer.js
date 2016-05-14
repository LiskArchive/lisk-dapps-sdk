var private = {}, self = null,
	library = null, modules = null;

function OutsideTransfer(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

OutsideTransfer.prototype.create = function (data, trs) {
	trs.recipientId = data.recipientId;
	trs.amount = data.amount;

	trs.asset.outsidetransfer = {
		src_id: data.src_id
	}

	return trs;
}

OutsideTransfer.prototype.calculateFee = function (trs) {
	return 0;
}

OutsideTransfer.prototype.verify = function (trs, sender, cb, scope) {
	var isAddress = /^[0-9]+[L|l]$/g;
	if (!trs.recipientId || !isAddress.test(trs.recipientId)) {
		return cb("Invalid recipient");
	}

	if (trs.amount <= 0) {
		return cb("Invalid transaction amount");
	}

	if (trs.senderPublicKey != modules.blockchain.blocks.genesisBlock().delegate) {
		return cb("Sender is not a delegate");
	}

	modules.api.sql.select({
		table: "asset_dapptransfer",
		condition: {
			src_id: trs.asset.outsidetransfer.src_id
		},
    fields: [{"src_id" : "id"}]
	}, function (err, found) {
		if (err) {
			return cb(err);
		}
    if (found.length) {
      return cb("Transaction already exists");
    }
		cb(null, trs);
	});
}

OutsideTransfer.prototype.getBytes = function (trs) {
	try {
		var buf = new Buffer(trs.asset.outsidetransfer.src_id, "utf8");
	} catch (e) {
		throw Error(e.toString());
	}

	return buf;
}

OutsideTransfer.prototype.apply = function (trs, sender, cb, scope) {
	modules.blockchain.accounts.mergeAccountAndGet({
		address: trs.recipientId,
		balance: {"LISK": trs.amount}
	}, cb, scope);
}

OutsideTransfer.prototype.undo = function (trs, sender, cb, scope) {
	modules.blockchain.accounts.undoMerging({
		address: trs.recipientId,
		balance: {"LISK": trs.amount}
	}, cb, scope);
}

OutsideTransfer.prototype.applyUnconfirmed = function (trs, sender, cb, scope) {
	modules.blockchain.accounts.mergeAccountAndGet({
		address: trs.recipientId,
		u_balance: {"LISK": trs.amount}
	}, cb, scope);
}

OutsideTransfer.prototype.undoUnconfirmed = function (trs, sender, cb, scope) {
	modules.blockchain.accounts.undoMerging({
		address: trs.recipientId,
		u_balance: {"LISK": trs.amount}
	}, cb, scope);
}

OutsideTransfer.prototype.ready = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

OutsideTransfer.prototype.save = function (trs, cb) {
	modules.api.sql.insert({
		table: "asset_dapptransfer",
		values: {
			src_id: trs.asset.outsidetransfer.src_id,
			transactionId: trs.id
		}
	}, cb);
}

OutsideTransfer.prototype.dbRead = function (row) {
	if (!row.t_dt_src_id) {
		return null;
	}
	return {
		outsidetransfer: {
			src_id: row.t_dt_src_id
		}
	};
}

OutsideTransfer.prototype.normalize = function (asset, cb) {
	library.validator.validate(asset, {
		type: "object",
		properties: {
			outsidetransfer: {
				type: "object",
				properties: {
					src_id: {
						type: "string",
						minLength: 1
					}
				},
				required: ["src_id"]
			}
		},
		required: ["outsidetransfer"]
	}, function (err) {
		if (err) {
			return cb(err[0].message);
		}
		cb();
	})
}

OutsideTransfer.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.logic.transaction.attachAssetType(1, self);
}

module.exports = OutsideTransfer;
