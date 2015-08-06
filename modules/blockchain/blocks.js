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
		if (!err) {
			private.genesisBlock = {
				associate: res.associate,
				authorId: res.authorId,
				pointId: res.pointId,
				pointHeight: res.pointHeight
			}

			private.lastBlock = private.genesisBlock;

			private.saveBlock(private.genesisBlock, function (err) {
				cb(err, self);
			});
		}else{
			cb(err);
		}
	});
}

private.getGenesis = function (cb) {
	var message = {
		call: "dapps#getGenesis",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

private.saveBlock = function (block, cb) {
	// save block
	setImmediate(cb);
}

private.verifySignatures = function (block, cb) {
	var blockHash = self.getBytes(block);

	if (block.id != modules.api.crypto.getId(blockHash)) {
		return cb("wrong id");
	}

	if (!modules.api.crypto.verify(block.delegate, block.signature, blockHash)) {
		return cb("wrong sign verify");
	}

	cb();
}

private.verify = function (block, cb) {
	if (private.lastBlock.pointId == private.genesisBlock.pointId) {
		return private.verifySignatures(block, cb);
	}
	modules.api.blocks.getBlock(block.pointId, function (err, cryptiBlock) {
		if (err) {
			cb(err);
		}
		if (cryptiBlock.previousBlock == private.lastBlock.pointId && cryptiBlock.height == private.lastBlock.pointHeight + 1) { // new correct block
			private.verifySignatures(block, cb);
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
			if (err) {
				console.log("processBlock", err);
			}
		});
	}
}

Blocks.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Blocks;