/*
 Crypti blocks API calls
 */

var sandbox = null;

function Blocks(sandbox) {
	sandbox = sandbox;
}

Blocks.prototype.getBlock = function (id, cb) {
	var message = {
		call: "blocks#getBlock",
		args: {
			id: id
		}
	};

	private.sandbox.sendMessage(message, cb);
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

	private.sandbox.sendMessage(message, cb);
}

Blocks.prototype.getHeight = function (cb) {
	var message = {
		call: "blocks#getHeight",
		args: {}
	};

	private.sandbox.sendMessage(message, cb);
}

Blocks.prototype.getFee = function (cb) {
	var message = {
		call: "blocks#getFee",
		args: {}
	};

	private.sandbox.sendMessage(message, cb);
}

module.exports = Blocks;