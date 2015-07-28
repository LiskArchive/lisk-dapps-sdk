/*
 Crypti blocks API calls
 */
var private = {};
private.library = null;
private.modules = null;

function Blocks(cb, library) {
	private.library = library;
	cb(null, this);
}

Blocks.prototype.getBlock = function (id, cb) {
	var message = {
		call: "blocks#getBlock",
		args: {
			id: id
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Blocks.prototype.getBlocks = function (filter, cb) {
	var message = {
		call: "blocks#getBlocks",
		args: {
			limit: filter.limit,
			orderBy: filter.orderBy,
			offset: filter.offset,
			generatorPublicKey: filter.generatorPublicKey,
			totalAmount: filter.totalAmount,
			totalFee: filter.totalFee,
			previousBlock: filter.previousBlock,
			height: filter.height
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Blocks.prototype.getHeight = function (cb) {
	var message = {
		call: "blocks#getHeight",
		args: {}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Blocks.prototype.getFee = function (cb) {
	var message = {
		call: "blocks#getFee",
		args: {}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Blocks.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Blocks;