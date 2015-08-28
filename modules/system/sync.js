var private = {}, self = null,
	library = null, modules = null;

function Sync(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

private.blockSync = function (lastBlock, cb) {
	modules.api.transport.getRandomPeer("get", "/blocks/height", null, function (err, res) {
		modules.api.transport.getPeer(res.peer, "get", "/blocks/height", null, function (err, res) {
		});
	});
}

Sync.prototype.onBind = function (_modules) {
	modules = _modules;
}

Sync.prototype.onBlockchainLoaded = function () {
	setImmediate(function nextBlockSync() {
		library.sequence.add(function (cb) {
			modules.blockchain.blocks.getLastBlock(function (err, lastBlock) {
				private.blockSync(lastBlock, cb);
			});
		}, function (err) {
			err && library.logger('blockSync timer', err);

			setTimeout(nextBlockSync, 10 * 1000)
		})
	});
}

module.exports = Sync;