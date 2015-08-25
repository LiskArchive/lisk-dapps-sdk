var private = {}, self = null,
	library = null, modules = null;

function Sync(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

private.loadBalances = function (lastBlockHeight, cb) {
	modules.api.dapps.getCommonBlock(lastBlockHeight, function (err, rawBalances) {
		if (err) {
			cb(err);
		}
		//b.height, t.id, t.senderId, t.amount
		for (var i = 0; i < rawBalances.length; i++) {

		}
	})
}

Sync.prototype.onBind = function (_modules) {
	modules = _modules;
}

Sync.prototype.onBlockchainLoaded = function () {
	//setImmediate(function nextLoadBalances() {
	//	library.sequence.add(function (cb) {
	//		modules.blockchain.getHeight(function (err, lastBlockHeight) {
	//			private.loadBalances(lastBlockHeight, cb);
	//		});
	//	}, function (err) {
	//		err && library.logger('loadBalances timer', err);
	//
	//		setTimeout(nextLoadBalances, 10 * 1000)
	//	})
	//});
}

module.exports = Sync;