var ByteBuffer = require('bytebuffer');
var crypto = require('crypto-browserify');
var bignum = require('browserify-bignum');

var private = {}, self = null,
	library = null, modules = null;

private.types = {};

//constructor
function Block(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

//public methods
Block.prototype.getBytes = function (block, withSignature) {
	var size = 8 + 4 + 4 + 4 + 32 + 32 + 8 + 4 + 4;

	if (withSignature && block.signature) {
		size = size + 64;
	}

	var bb = new ByteBuffer(size, true);

	if (block.prevBlockId) {
		var pb = bignum(block.prevBlockId).toBuffer({size: '8'});
		for (var i = 0; i < 8; i++) {
			bb.writeByte(pb[i]);
		}
	} else {
		for (var i = 0; i < 8; i++) {
			bb.writeByte(0);
		}
	}

	bb.writeInt(block.height);
	bb.writeInt(block.timestamp);
	bb.writeInt(block.payloadLength);

	var ph = new Buffer(block.payloadHash, 'hex');
	for (var i = 0; i < ph.length; i++) {
		bb.writeByte(ph[i]);
	}

	var pb = new Buffer(block.delegate, 'hex');
	for (var i = 0; i < pb.length; i++) {
		bb.writeByte(pb[i]);
	}

	pb = bignum(block.pointId).toBuffer({size: '8'});
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

Block.prototype.verifySignature = function (block) {
	var blockBytes = self.getBytes(block);
	if (block.id != modules.api.crypto.getId(blockBytes)) {
		return false;
	}
	if (!modules.api.crypto.verify(block.delegate, block.signature, blockBytes)) {
		return false;
	}

	return true;
}

Block.prototype.save = function (block, cb) {
	modules.api.sql.insert({
		table: "blocks",
		values: {
			id: block.id,
			timestamp: block.timestamp,
			height: block.height,
			payloadLength: block.payloadLength,
			payloadHash: block.payloadHash,
			prevBlockId: block.prevBlockId,
			pointId: block.pointId,
			pointHeight: block.pointHeight,
			delegate: block.delegate,
			signature: block.signature,
			count: block.count
		}
	}, cb);
}

Block.prototype.normalize = function (block, cb) {
	for (var i in block) {
		if (block[i] === null || typeof block[i] == 'undefined') {
			delete block[i];
		}
	}

	library.validator.validate(block, {
		type: "object",
		properties: {
			id: {
				type: "string"
			},
			timestamp: {
				type: "integer"
			},
			payloadLength: {
				type: "integer"
			},
			payloadHash: {
				type: "string",
				format: "hex"
			},
			prevBlockId: {
				type: "string"
			},
			pointId: {
				type: "string"
			},
			pointHeight: {
				type: "integer"
			},
			delegate: {
				type: "string",
				format: "publicKey"
			},
			signature: {
				type: "string",
				format: "signature"
			},
			count: {
				type: "integer"
			}
		},
		required: ['id', 'timestamp', 'payloadLength', 'payloadHash', 'pointId', 'pointHeight', 'delegate', 'signature', 'count']
	}, cb);
}

Block.prototype.dbRead = function (row) {
	return {
		id: row.b_id,
		height: row.b_height,
		timestamp: row.b_timestamp,
		payloadLength: row.b_payloadLength,
		payloadHash: row.b_payloadHash,
		prevBlockId: row.b_prevBlockId,
		pointId: row.b_pointId,
		pointHeight: row.b_pointHeight,
		delegate: row.b_delegate,
		signature: row.b_signature,
		count: row.b_count
	};
}

Block.prototype.onBind = function (_modules) {
	modules = _modules;
}

//export
module.exports = Block;