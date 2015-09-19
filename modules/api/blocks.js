/*
 Crypti blocks API calls
 */
var private = {}, self = null,
library = null, modules = null;

function Blocks(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Blocks.prototype.getBlock = function (id, cb) {
	var message = {
		call: "blocks#getBlock",
		args: {
			id: id
		}
	};

	library.sandbox.sendMessage(message, cb);
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

	library.sandbox.sendMessage(message, cb);
}

Blocks.prototype.getHeight = function (cb) {
	var message = {
		call: "blocks#getHeight",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Blocks.prototype.getFee = function (cb) {
	var message = {
		call: "blocks#getFee",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Blocks.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Blocks;