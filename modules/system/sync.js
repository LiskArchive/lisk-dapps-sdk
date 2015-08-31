var bignum = require('browserify-bignum');

var private = {}, self = null,
	library = null, modules = null;

function Sync(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

private.findUpdate = function (lastBlock, peer, cb) {
	modules.api.transport.getRandomPeer(peer, "get", "/blocks/common", {lastId: lastBlock.height}, function (err, res) {
		if (err || res.body.success) {
			return cb(err);
		}

		if (lastBlock.height - res.body.response.commonBlock.height > 1440) {
			return cb();
		}

		modules.api.transport.getRandomPeer(peer, "get", "/blocks", {commonId: res.body.response.commonBlock.height}, function (err, res) {
			async.eachSeries(res.body.response.blocks, function (block, cb) {

			});
		});

	});
}

private.blockSync = function (lastBlock, cb) {
	modules.api.transport.getRandomPeer("get", "/blocks/height", null, function (err, res) {
		if (res.body.success) {
			modules.blockchain.blocks.getLastBlock(function (err, lastBlock) {
				if (bignum(lastBlock.height).lt(res.body.response.height)) {
					private.findUpdate(lastBlock, data.peer, cb);
				} else {
					setImmediate(cb);
				}
			});
		} else {
			setImmediate(cb);
		}
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