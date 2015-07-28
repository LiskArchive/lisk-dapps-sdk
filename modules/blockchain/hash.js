var bytebuffer = require('bytebuffer');

var private = {};
private.library = null;
private.modules = null;
private.last = null;

private.getBytes = function (hashObj) {
	var bb = new ByteBuffer(32 + 4, true);

	for (var i = 0; i < 32; i++) {
		bb.writeByte(hashObj.hash[i]);
	}

	bb.writeInt(hashObj.count);

	bb.flip();
	return bb.toBuffer();
}

function Hash(cb, library) {
	private.library = library;
	cb(null, this);
}

Hash.prototype.processHash = function (hash, cb) {
	setImmediate(cb);
}

Hash.prototype.createHash = function (delegate, cb) {
	var unconfirmedList = private.modules.data.getUnconfirmedList();

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

				private.modules.transport.message("hash", hashObj);
			});
		}
	});
}

Hash.prototype.saveHash = function (hash, cb) {
	// save hash
	setImmediate(cb);
}

Hash.prototype.loadHashOffset = function (cb) {
	setImmediate(cb);
}

Hash.prototype.getHeight = function () {
	return private.last.height;
}

Hash.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Hash;