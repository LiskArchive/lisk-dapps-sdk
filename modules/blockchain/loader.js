var async = require('async');

var private = {}, self = null,
	library = null, modules = null;

function Loader(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

private.loadBlockChain = function () {
	var offset = 0, limit = 100;

	modules.blockchain.blocks.count(function (err, count) {
		if (err) {
			return library.logger('blocks.count', err)
		}

		private.total = count;
		library.logger('blocks ' + count);
		async.until(
			function () {
				return count < offset
			}, function (cb) {
				library.logger('current ' + offset);
				setImmediate(function () {
					modules.blockchain.blocks.loadBlocksOffset(limit, offset, function (err, lastBlockOffset) {
						if (err) {
							return cb(err);
						}

						offset = offset + limit;
						private.loadingLastBlock = lastBlockOffset;

						cb();
					});
				})
			}, function (err) {
				if (err) {
					library.logger('loadBlocksOffset', err);
					if (err.block) {
						library.logger('blockchain failed at ', err.block.height)
						modules.blocks.simpleDeleteAfterBlock(err.block.id, function (err, res) {
							library.logger('blockchain clipped');
							library.bus.message('blockchainReady');
						})
					}
				} else {
					library.logger('blockchain ready');
					library.bus.message('blockchainReady');
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