var private = {}, self = null,
library = null, modules = null;

/**
 * Creates instance of Loader API. Use *modules.api.loader* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
function Loader(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

/**
 * Get status of loading bc.db file
 * @param {Loader~statusCallback} cb - Callback handles response from Crypti.
 */
Loader.prototype.status = function (cb) {
	var message = {
		call: "loader#status",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Loader~statusCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.loaded - Is blockchain loaded.
 * @param response.now - Amount of loaded blocks.
 * @param response.blocksCount - Count of blocks in blockchain.
 */

/**
 * Get status of wallet sync.
 *
 * @param {Loader~syncCallback} cb - Callback handles response from Crypti.
 */
Loader.prototype.sync = function (cb) {
	var message = {
		call: "loader#sync",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Loader~syncCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.sync - Is syncing.
 * @param response.blocks - Count of blocks to sync.
 * @param response.height - Current height of blockchain.
 */

Loader.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Loader;