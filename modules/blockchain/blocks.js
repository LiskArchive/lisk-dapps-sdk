var crypto = require('crypto-browserify');
var path = require('path');
var async = require('async');
var util = require('util');

var private = {}, self = null,
	library = null, modules = null;
private.lastBlock = null;
private.genesisBlock = null;
private.loaded = false;

function Blocks(cb, _library) {
	self = this;
	library = _library;

	private.genesisBlock = require(path.join(__dirname, "../../genesis.json"));

	private.lastBlock = private.genesisBlock;

	cb(null, self);
}

private.row2object = function (row) {
	for (var
			 out = {},
			 length = this.length,
			 i = 0; i < length; i++
	) {
		out[this[i]] = row[i];
	}
	return out;
}

private.row2parsed = function (row) {
	for (var
			 out = {},
			 fields = this.f,
			 parsers = this.p,
			 length = fields.length,
			 i = 0; i < length; i++
	) {
		if (parsers[i] === Buffer) {
			out[fields[i]] = parsers[i](row[i], 'hex');
		} else if (parsers[i] === Array) {
			out[fields[i]] = row[i] ? row[i].split(",") : []
		} else {
			out[fields[i]] = parsers[i](row[i]);
		}
	}
	return out;
}

private.parseFields = function ($fields) {
	for (var
			 current,
			 fields = Object.keys($fields),
			 parsers = [],
			 length = fields.length,
			 i = 0; i < length; i++
	) {
		current = $fields[fields[i]];
		parsers[i] = current === Boolean ?
			$Boolean : (
			current === Date ?
				$Date :
			current || String
		)
		;
	}

	return {f: fields, p: parsers};
}

private.readDbRows = function (rows) {
	var blocks = {};
	var order = [];
	for (var i = 0, length = rows.length; i < length; i++) {
		var __block = modules.logic.block.dbRead(rows[i]);
		if (__block) {
			if (!blocks[__block.id]) {
				order.push(__block.id);
				blocks[__block.id] = __block;
			}

			var __transaction = modules.logic.transaction.dbRead(rows[i]);
			blocks[__block.id].transactions = blocks[__block.id].transactions || {};
			if (__transaction) {
				if (!blocks[__block.id].transactions[__transaction.id]) {
					blocks[__block.id].transactions[__transaction.id] = __transaction;
				}
			}
		}
	}

	blocks = order.map(function (v) {
		blocks[v].transactions = Object.keys(blocks[v].transactions).map(function (t) {
			return blocks[v].transactions[t];
		});
		return blocks[v];
	});

	return blocks;
}

private.saveBlock = function (block, cb) {
	modules.logic.block.save(block, function (err) {
		async.eachSeries(block.transactions, function (trs, cb) {
			modules.logic.transaction.save(trs, cb);
		}, cb);
	});
}

private.verify = function (block, cb) {
	if (private.lastBlock.pointId == private.genesisBlock.pointId) {
		try {
			var valid = modules.logic.block.verifySignature(block);
		} catch (e) {
			return cb(e.toString());
		}
		if (!valid) {
			return cb("wrong block");
		}
		return cb();
	}
	modules.api.blocks.getBlock(block.pointId, function (err, data) {
		if (err) {
			cb(err);
		}
		var cryptiBlock = data.block;
		if (cryptiBlock.previousBlock == private.lastBlock.pointId && cryptiBlock.height == private.lastBlock.pointHeight + 1) { // new correct block
			modules.api.sql.select({
				table: "blocks",
				condition: {
					id: block.id
				},
				fields: ["id"]
			}, function (err, found) {
				if (err || found.length) {
					return cb("wrong block");
				}
				try {
					var valid = modules.logic.block.verifySignature(block);
				} catch (e) {
					return cb(e.toString());
				}
				if (!valid) {
					return cb("wrong block");
				}
				return cb();
			});
		} else {
			cb("skip block");
		}
	})
}

Blocks.prototype.genesisBlock = function () {
	return private.genesisBlock;
}

Blocks.prototype.processBlock = function (block, cb) {
	private.verify(block, function (err) {
		if (err) {
			return cb(err);
		}
		private.lastBlock = block;
		private.saveBlock(block, cb);
	});
}

Blocks.prototype.createBlock = function (executor, point, cb) {
	modules.blockchain.transactions.getUnconfirmedTransactionList(false, function (err, unconfirmedList) {
		// object
		var blockObj = {
			delegate: executor.keypair.publicKey,
			pointId: point.id,
			pointHeight: point.height,
			count: unconfirmedList.length,
			transactions: unconfirmedList
		};

		var blockBytes = modules.logic.block.getBytes(blockObj);

		blockObj.id = modules.api.crypto.getId(blockBytes);
		blockObj.signature = modules.api.crypto.sign(executor.keypair, blockBytes);

		self.processBlock(blockObj, cb);
	});
}

Blocks.prototype.loadBlocksOffset = function (limit, offset, cb) {
	self.getBlocks(function (err, blocks) {
		if (err) {
			return cb(err);
		}

		blocks = util.isArray(library.scheme.alias) ?
			blocks.map(private.row2object, library.scheme.alias) :
			blocks.map(private.row2parsed, private.parseFields(library.scheme.alias))

		blocks = private.readDbRows(blocks);

		async.eachSeries(blocks, function (block, cb) {
			try {
				var valid = modules.logic.block.verifySignature(block);
			} catch (e) {
				return setImmediate(cb, {
					message: e.toString(),
					block: block
				});
			}
			if (!valid) {
				return setImmediate(cb, {
					message: "Can't verify signature",
					block: block
				});
			}
			async.eachSeries(block.transactions, function (transaction, cb) {
				modules.accounts.setAccountAndGet({publicKey: transaction.senderPublicKey}, function (err, sender) {
					if (err) {
						return cb({
							message: err,
							transaction: transaction,
							block: block
						});
					}
					modules.logic.transaction.verify(transaction, sender, function (err) {
						if (err) {
							return setImmediate(cb, {
								message: err,
								transaction: transaction,
								block: block
							});
						}

						private.applyTransaction(block, transaction, cb);
					});
				});
			}, cb);
		}, function (err) {
			cb(err, blocks);
		});
	}, {limit: limit, offset: offset})
}

Blocks.prototype.simpleDeleteAfterBlock = function (blockId, cb) {
	setImmediate(cb);
}

Blocks.prototype.count = function (cb) {
	modules.api.sql.select({
		table: "blocks",
		fields: [{
			expression: 'count(*)'
		}]
	}, function (err, rows) {
		var count = !err && Number(rows[0][0]);
		cb(err, count);
	});
}

Blocks.prototype.getHeight = function (cb) {
	cb(null, private.lastBlock.pointHeight);
}

Blocks.prototype.getBlock = function (cb, query) {
	modules.api.sql.select({
		table: "blocks",
		condition: {
			id: query.id
		},
		fields: ["id", "pointId", "pointHeight", "delegate", "signature", "count"],
		map: ["id", "pointId", "pointHeight", "delegate", "signature", "count"]
	}, cb);
}

Blocks.prototype.getBlocks = function (cb, query) {
	modules.api.sql.select({
		table: "blocks",
		alias: "b",
		join: [{
			type: 'left outer',
			table: 'transactions',
			alias: "t",
			on: {"b.id": "t.blockId"}
		}, {
			type: 'left outer',
			table: 'asset_dapptransfer',
			alias: "t_dt",
			on: {"t.id": "t_dt.transactionId"}
		}],
		limit: query.limit,
		offset: query.offset,
		fields: library.scheme.fields
	}, cb);
}

Blocks.prototype.onMessage = function (query) {
	if (query.topic == "block" && private.loaded) {
		var block = query.message;
		self.processBlock(block, function (err) {
			if (err) {
				console.log("processBlock", err);
			}
		});
	}
}

Blocks.prototype.onBlockchainLoaded = function () {
	private.loaded = true;
}

Blocks.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.api.sql.select({
		table: "blocks",
		condition: {
			id: private.genesisBlock.id
		},
		fields: ["id"]
	}, function (err, found) {
		if (err) {
			console.log(err)
			process.exit(0);
		}
		if (!found.length) {
			self.processBlock(private.genesisBlock, function (err) {
				if (!err) {
					library.bus.message("blockchainReady");
				}
			})
		} else {
			library.bus.message("blockchainReady");
		}
	});
}

module.exports = Blocks;