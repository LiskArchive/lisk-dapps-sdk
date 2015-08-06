var ByteBuffer = require('bytebuffer');
var crypto = require('crypto-browserify');
var bignum = require('browserify-bignum');

var private = {}, self = null,
	library = null, modules = null;
private.lastBlock = null;
private.genesisBlock = null;

function Blocks(cb, _library) {
	self = this;
	library = _library;
	private.getGenesis(function (err, res) {
		console.log(err, res)
		if (!err) {
			private.genesisBlock = {
				associate: res.associate,
				authorId: res.authorId,
				pointId: res.pointId,
				pointHeight: res.pointHeight
			}

			private.lastBlock = private.genesisBlock;
		}
		cb(err, self);
	});
}

private.getGenesis = function (cb) {
	var message = {
		call: "dapps#getGenesis",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

private.getBytes = function (blockObj) {
	var bb = new ByteBuffer(32 + 4, true);

	for (var i = 0; i < 32; i++) {
		bb.writeByte(blockObj.block[i]);
	}

	bb.writeInt(blockObj.count);

	bb.flip();
	return bb.toBuffer();
}

Blocks.prototype.genesisBlock = function () {
	return private.genesisBlock;
}

Blocks.prototype.processBlock = function (block, cb) {
	var newDappBlock = block;

	if (private.lastBlock.pointId == private.genesisBlock.pointId) {
		console.log("first block after genesis", newDappBlock);
		return cb();
	}
	modules.api.blocks.getBlock(block.pointId, function (err, cryptiBlock) {
		if (cryptiBlock.previousBlock == private.lastBlock.pointId && cryptiBlock.height == private.lastBlock.pointHeight + 1) { // new correct block
			console.log("new block", newDappBlock);
			cb();
		} else {
			console.log("wrong block", newDappBlock);
			cb();
		}
	})
}

Blocks.prototype.getBytes = function (block, withSignature) {
	var size = 32 + 8 + 4 + 4;

	if (withSignature && block.signature) {
		size = size + 64;
	}

	var bb = new ByteBuffer(size, true);

	var pb = new Buffer(block.delegate, 'hex');
	for (var i = 0; i < pb.length; i++) {
		bb.writeByte(pb[i]);
	}

	var pb = bignum(block.pointId).toBuffer({size: '8'});
	for (var i = 0; i < 8; i++) {
		bb.writeByte(pb[i]);
	}

	bb.writeInt(block.pointHeight);

	bb.writeInt(block.count);

	if (withSignature && block.signature) {
		var pb = new Buffer(block.signature, 'hex');
		for (var i = 0; i < pb.length; i++) {
			bb.writeByte(pb[i]);
		}
	}

	bb.flip();
	var b = bb.toBuffer();

	return b;
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

		var blockHash = self.getBytes(blockObj);

		blockObj.id = modules.api.crypto.getId(blockHash);
		blockObj.signature = modules.api.crypto.sign(executor.secret, blockHash);

		private.lastBlock = blockObj;
		modules.api.transport.message("block", blockObj, cb);
	});
}

Blocks.prototype.saveBlock = function (block, cb) {
	// save block
	setImmediate(cb);
}

Blocks.prototype.loadBlocksOffset = function (cb) {
	setImmediate(cb);
}

Blocks.prototype.getHeight = function () {
	return private.lastBlock.height;
}

Blocks.prototype.onMessage = function (query) {
	if (query.topic == "block") {
		var block = query.message;
		self.processBlock(block, function (err) {
			console.log("processBlock", err)
		});
	}
}

Blocks.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Blocks;