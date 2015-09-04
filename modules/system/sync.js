var bignum = require('browserify-bignum');

var private = {}, self = null,
	library = null, modules = null;

function Sync(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

private.createSandbox = function (commonBlock, cb) {
	modules.blockchain.accounts.clone(function (err, accountDB) {
		var sb = {
			lastBlock: commonBlock,
			accounts: accountDB.data,
			accountsIndexById: accountDB.index,
			unconfirmedTransactions: [],
			unconfirmedTransactionsIdIndex: {},
			doubleSpendingTransactions: {}
		}

		cb(null, sb);
	});
}

private.findUpdate = function (lastBlock, peer, cb) {
	modules.blockchain.blocks.getCommonBlock(lastBlock.height, peer, function (err, commonBlock) {
		console.log("getCommonBlock", err, commonBlock)
		if (err || !commonBlock) {
			return cb(err);
		}

		if (lastBlock.height - commonBlock.height > 1440) {
			return cb();
		}

		private.createSandbox(commonBlock, function (err, sandbox) {
			console.log("sandbox", err, sandbox)
			modules.blockchain.blocks.loadBlocksPeer(peer, cb, sandbox);
		});
	}, cb);
}

private.blockSync = function (lastBlock, cb) {
	console.log("private.blockSync")
	modules.api.transport.getRandomPeer("get", "/blocks/height", null, function (err, res) {
		if (res.body.success) {
			modules.blockchain.blocks.getLastBlock(function (err, lastBlock) {
				console.log(lastBlock.height, res.body.response.height)
				if (bignum(lastBlock.height).lt(res.body.response.height)) {
					private.findUpdate(lastBlock, res.peer, cb);
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