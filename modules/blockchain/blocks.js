var crypto = require('crypto-browserify');
var path = require('path');
var async = require('async');

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

private.saveBlock = function (block, cb) {
	modules.logic.block.save(block, function (err) {
		async.eachSeries(block.transactions, function (trs, cb) {
			modules.logic.transaction.save(trs, cb);
		}, cb);
	});
}

private.verify = function (block, cb) {
	if (private.lastBlock.pointId == private.genesisBlock.pointId) {
		return modules.logic.block.verifySignature(block, cb);
	}
	modules.api.blocks.getBlock(block.pointId, function (err, cryptiBlock) {
		if (err) {
			cb(err);
		}
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
				modules.logic.block.verifySignature(block, cb);
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

Blocks.prototype.loadBlocksOffset = function (cb) {
	setImmediate(cb);
}

Blocks.prototype.getHeight = function (query, cb) {
	cb(null, private.lastBlock.height);
}

Blocks.prototype.getBlock = function (query, cb) {
	modules.api.sql.select({
		table: "blocks",
		condition: {
			id: query.id
		},
		fields: ["id", "pointId", "pointHeight", "delegate", "signature", "count"],
	}, cb);
}

Blocks.prototype.getBlocks = function (query, cb) {
	modules.api.sql.select({
		table: "blocks",
		join: [{
			type: 'left outer',
			table: 'transactions',
			on: {"blocks.id": "transactions.blockId"}
		}, {
			type: 'left outer',
			table: 'asset_dapptransfer',
			on: {"transactions.id": "asset_dapptransfer.transactionId"}
		}],
		limit: query.limit,
		offset: query.offset
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

Blocks.prototype.onBlockchainReady = function () {
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