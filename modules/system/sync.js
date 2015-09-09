var bignum = require('browserify-bignum');
var async = require('async');
var ip = require('ip')

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
		if (err || !commonBlock) {
			return cb(err);
		}

		modules.blockchain.blocks.getBlock(function (err, block) {
			if (err){
				return cb(err);
			}

			block = modules.blockchain.blocks.readDbRows(block);

			private.createSandbox(block[0], function (err, sandbox) {
				if (err) {
					return cb(err);
				}
				modules.blockchain.blocks.loadBlocksPeer(peer, function (err, blocks) {
					if (err) {
						return cb(err);
					}

					console.log("loaded blocks", blocks.length)

					library.sequence.add(function (cb) {
						async.series([
							function (cb) {
								console.log("deleteBlocksBefore", commonBlock.height)
								modules.blockchain.blocks.deleteBlocksBefore(commonBlock, cb);
							},
							function (cb) {
								console.log("applyBlocks", blocks.map(function(block){
									return block.height
								}).join(","))
								modules.blockchain.blocks.applyBlocks(blocks, cb);
							},
							function (cb) {
								console.log("saveBlocks", blocks.map(function(block){
									return block.height
								}).join(","))
								modules.blockchain.blocks.saveBlocks(blocks, cb);
							}
						], function (err) {
							if (!err) {
								return cb();
							}
							library.logger("sync", err);
							//TODO:rollback after last error block
							modules.blockchain.blocks.deleteBlocksBefore(commonBlock, cb);
						});
					}, cb);
				}, sandbox);
			});
		}, {id: commonBlock.id});
	});
}

private.transactionsSync = function (cb) {
	modules.api.transport.getRandomPeer("get", "/transactions", null, function (err, res) {
		if (err || !res.body.success) {
			return cb(err);
		}
		async.eachSeries(res.body.response, function (transaction, cb) {
			modules.blockchain.transactions.processUnconfirmedTransaction(transaction, function (err) {
				cb();
			});
		}, cb);
	});
}

private.blockSync = function (cb) {
	modules.blockchain.blocks.getLastBlock(function (err, lastBlock) {
		if (err) {
			return cb(err);
		}
		modules.api.transport.getRandomPeer("get", "/blocks/height", null, function (err, res) {
			if (!err && res.body.success) {
				modules.blockchain.blocks.getLastBlock(function (err, lastBlock) {
					if (!err && bignum(lastBlock.height).lt(res.body.response)) {
						console.log("found blocks at " + ip.fromLong(res.peer.ip) + ":" + res.peer.port);
						private.findUpdate(lastBlock, res.peer, cb);
					} else {
						console.log("doesn't found blocks at " + ip.fromLong(res.peer.ip) + ":" + res.peer.port);
						setImmediate(cb);
					}
				});
			} else {
				setImmediate(cb);
			}
		});
	});
}

Sync.prototype.onBind = function (_modules) {
	modules = _modules;
}

Sync.prototype.onBlockchainLoaded = function () {
	setImmediate(function nextBlockSync() {
		private.blockSync(function (err) {
			err && library.logger('blockSync timer', err);

			setTimeout(nextBlockSync, 10 * 1000)
		});
	});
	setImmediate(function nextU_TransactionsSync() {
		private.transactionsSync(function (err) {
			err && library.logger('transactionsSync timer', err);

			setTimeout(nextU_TransactionsSync, 5 * 1000)
		});
	});
}

module.exports = Sync;