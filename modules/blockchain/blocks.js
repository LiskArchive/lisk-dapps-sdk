var crypto = require('crypto-browserify');
var path = require('path');

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
	console.log(block)
	modules.api.sql.insert({
		table: "blocks",
		values: {
			id: block.id,
			pointId: block.pointId,
			pointHeight: block.pointHeight,
			delegate: block.delegate,
			signature: block.signature,
			count: block.count
		}
	}, cb);
	//setImmediate(cb);
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
			console.log(err)
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

		private.lastBlock = blockObj;
		modules.api.transport.message("block", blockObj, cb);
	});
}

Blocks.prototype.loadBlocksOffset = function (cb) {
	setImmediate(cb);
}

Blocks.prototype.getHeight = function () {
	return private.lastBlock.height;
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
		}
	});
}

module.exports = Blocks;