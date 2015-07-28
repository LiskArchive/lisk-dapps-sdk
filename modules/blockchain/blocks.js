var bytebuffer = require('bytebuffer');

var private = {};
var library = null;
var modules = null;
private.last = null;

function Blocks(cb, _library) {
	library = _library;
	cb(null, this);
}

private.getBytes = function (hashObj) {
	var bb = new ByteBuffer(32 + 4, true);

	for (var i = 0; i < 32; i++) {
		bb.writeByte(hashObj.hash[i]);
	}

	bb.writeInt(hashObj.count);

	bb.flip();
	return bb.toBuffer();
}

Blocks.prototype.processBlock = function (hash, cb) {
	setImmediate(cb);
}

Blocks.prototype.createBlock = function (delegate, cb) {
	var unconfirmedList = modules.blockchain.transactions.getUnconfirmedList();

	// get bytes
	var bytes = new Buffer(0);

	unconfirmedList.forEach(function (trs) {
		bytes = Buffer.concat([bytes, trs.getBytes()]);
	});

	// generate hash
	var hash = modules.api.crypto.sha256(bytes.toString('hex'), function (err, hash) {
		if (err) {
			return cb(err);
		} else {
			// object
			var hashObj = {
				transactions: unconfirmedList,
				count: unconfirmedList.length,
				hash: hash
			};

			// get bytes of data
			bytes = private.getBytes(hashObj);

			// sign
			modules.api.crypto.sign(library.config.secret, bytes.toString('hex'), function (err, signature) {
				hashObj.signature = signature;
				hashObj.hash = hashObj.hash.toString('hex');

				modules.api.transport.message("hash", hashObj);
			});
		}
	});
}

Blocks.prototype.saveBlock = function (hash, cb) {
	// save hash
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