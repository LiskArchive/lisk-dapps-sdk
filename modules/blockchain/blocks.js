var bytebuffer = require('bytebuffer');
var crypto = require('crypto-browserify');

var private = {}, self = null,
	library = null, modules = null;
private.last = null;

function Blocks(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
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

Blocks.prototype.processBlock = function (block, cb) {
	setImmediate(cb);
}

Blocks.prototype.createBlock = function (delegate, point, cb) {
	modules.blockchain.transactions.getUnconfirmedTransactionList(false, function (err, unconfirmedList) {
		// object
		var blockObj = {
			delegate: delegate.publicKey,
			point: point,
			transactions: unconfirmedList,
			count: unconfirmedList.length
		};

		var executor = modules.blockchain.accounts.getExecutor();

		var blockJSON = JSON.stringify(blockObj);

		var blockBin = (new Buffer(blockJSON)).toString('hex');

		blockObj.id = modules.api.crypto.getId(blockBin);
		blockObj.signature = modules.api.crypto.sign(executor.secret, blockBin);

		private.last = blockObj;
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
	return private.last.height;
}

Blocks.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Blocks;