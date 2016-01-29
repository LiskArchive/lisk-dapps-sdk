/*
 Lisk blocks API calls
 */
var private = {}, self = null,
library = null, modules = null;

/**
 * Creates instance of Blocks API. Use *modules.api.blocks* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
function Blocks(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

/**
 * Get block by id.
 *
 * @param id - Block id.
 * @param {Blocks~blockCallback} cb - Callback handles response from Lisk.
 */
Blocks.prototype.getBlock = function (id, cb) {
	var message = {
		call: "blocks#getBlock",
		args: {
			id: id
		}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Blocks~blockCallback
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.block - Block object.
 * @param response.block.id - Id of block.
 * @param response.block.version - Version of block.
 * @param response.block.timestamp - Timestamp of block.
 * @param response.block.height - Height of block.
 * @param response.block.previousBlock - Id of previous block.
 * @param response.block.numberOfTransactions - Number of transactions in block.
 * @param response.block.totalAmount - Total amount of block.
 * @param response.block.totalFee - Total fee of block.
 * @param response.block.payloadLength - Length of block content.
 * @param response.block.payloadHash - Hash of block content.
 * @param response.block.generatorPublicKey - Public key of block generator.
 * @param response.block.blockSignature - Signature of block.
 * @param response.block.confirmations - Number of confirmations.
 */

/**
 * Get blocks from Lisk.
 *
 * @param filter - Filter object.
 * @param filter.limit - Limit of blocks to get.
 * @param filter.orderBy - Field to order blocks.
 * @param filter.offset - Offset of blocks to get.
 * @param filter.generatorPublicKey - Public key block generator.
 * @param filter.totalAmount - Total amount of block.
 * @param filter.totalFee - Total fee of block.
 * @param filter.previousBlock - Previous block id.
 * @param filter.height - Height of block.
 * @param {Blocks~getBlocksCallback} cb - Callback handles response from Lisk.
 */
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

/**
 * @callback Blocks~getBlocksCallback
 * @param error - Error from api call execution.
 * @param response - Response from api call execution.
 * @param response.blocks - Array of blocks.
 */

/**
 * Get height of blockchain.
 * @param {Blocks~getHeightCallback} cb - Callback handles response from Lisk.
 */
Blocks.prototype.getHeight = function (cb) {
	var message = {
		call: "blocks#getHeight",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Blocks~getHeightCallback
 * @param error - Error from api call execution.
 * @param response - Response from api call execution.
 * @param response.height - Height of blockchain.
 */

/**
 * Get fee percent of transaction in blockchain.
 * @param {Blocks~getFeeCallback} cb - Callback handles response from Lisk.
 */
Blocks.prototype.getFee = function (cb) {
	var message = {
		call: "blocks#getFee",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Blocks~getFeeCallback
 * @param error - Error from api call execution.
 * @param response - Response from api call execution.
 * @param response.fee - Fee percent of base transaction.
 */

Blocks.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Blocks;
