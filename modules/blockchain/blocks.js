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
	var unconfirmedList = modules.blockchain.transactions.getUnconfirmedList();

	// object
	var blockObj = {
		delegate: delegate.publicKey,
		point: point,
		transactions: unconfirmedList,
		count: unconfirmedList.length
	};

	var blockJSON = JSON.stringify(blockObj);

	var blockBin = (new Buffer(blockJSON)).toString('hex');

	blockObj.id = modules.api.crypto.getId(blockBin);
	blockObj.signature = modules.api.crypto.sign(library.config.secret, blockBin);

	modules.api.transport.message("block", blockObj);
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