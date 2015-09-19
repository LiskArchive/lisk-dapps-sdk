var async = require('async');

var private = {}, self = null,
	library = null, modules = null;

function Loader(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}


private.loadBlockChain = function () {
	var offset = 0, limit = 1000;

	modules.blockchain.blocks.count(function (err, count) {
		if (err) {
			return library.logger('blocks.count', err)
		}

		library.logger('blocks ' + count);
		async.until(
			function () {
				return count < offset
			}, function (cb) {
				library.logger('current ' + offset);
				modules.blockchain.blocks.loadBlocksOffset(limit, offset, function (err) {
					if (err) {
						return setImmediate(cb, err);
					}

					offset = offset + limit;

					setImmediate(cb);
				});
			}, function (err) {
				if (err) {
					library.logger('loadBlocksOffset', err);
					if (err.block) {
						library.logger('blockchain failed at ', err.block.height)
						modules.blockchain.blocks.simpleDeleteAfterBlock(err.block.height, function (err) {
							library.logger('blockchain clipped');
							library.bus.message('blockchainLoaded');
						})
					}
				} else {
					library.logger('blockchain loaded');
					library.bus.message('blockchainLoaded');
				}
			}
		)
	});
}

Loader.prototype.onBind = function (_modules) {
	modules = _modules;
}

Loader.prototype.onBlockchainReady = function () {
	private.loadBlockChain();
}

Loader.prototype.onMessage = function (msg) {

}

module.exports = Loader;