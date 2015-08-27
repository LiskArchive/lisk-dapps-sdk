var private = {}, self = null,
	library = null, modules = null;

function Sync(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

private.blockSync = function (lastBlock, cb) {
	console.log("private.blockSync", lastBlock.pointHeight)
	modules.api.transport.request("height", {}, function (err, height) {
		console.log(err, height)
	});
	//modules.api.dapps.getCommonBlock(lastBlockHeight, function (err, rawBalances) {
	//	if (err) {
	//		cb(err);
	//	}
	//	//b.height, t.id, t.senderId, t.amount
	//	for (var i = 0; i < rawBalances.length; i++) {
	//
	//	}
	//})
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