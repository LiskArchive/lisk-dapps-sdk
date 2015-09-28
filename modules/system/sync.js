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
	var self = this;

	modules.blockchain.blocks.getCommonBlock(lastBlock.height, peer, function (err, commonBlock) {
		if (err || !commonBlock) {
			return cb(err);
		}

		modules.blockchain.blocks.getBlock(function (err, block) {
			if (err) {
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

					library.sequence.add(function (cb) {
						async.series([
							function (cb) {
								if (commonBlock.height == modules.blockchain.blocks.getLastBlock().height) {
									return cb()
								}
								console.log("deleteBlocksBefore", commonBlock.height)
								modules.blockchain.blocks.deleteBlocksBefore(commonBlock, cb);
							},
							function (cb) {
								console.log("apply and save blocks", blocks.map(function (block) {
									return block.height
								}).join(","))
								async.series([
									function (cb) {
										modules.blockchain.blocks.applyBatchBlock(blocks, cb);
									},
									function (cb) {
										modules.blockchain.blocks.saveBatchBlock(blocks, function (err) {
											if (err) {
												library.logger(err);
												process.exit(0);
											}
											cb();
										});
									}], cb);
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
	modules.api.blocks.getHeight(function (err, height) {
		var lastBlock = modules.blockchain.blocks.getLastBlock();

		if (lastBlock.pointHeight == height) {
			return cb();
		}

		modules.api.transport.getRandomPeer("get", "/blocks/height", null, function (err, res) {
			if (!err && res.body.success) {
				if (bignum(lastBlock.height).lt(res.body.response)) {
					console.log("found blocks at " + ip.fromLong(res.peer.ip) + ":" + res.peer.port);
					private.findUpdate(lastBlock, res.peer, cb);
				} else {
					//console.log("doesn't found blocks at " + ip.fromLong(res.peer.ip) + ":" + res.peer.port);
					setImmediate(cb);
				}
			} else {
				setImmediate(cb);
			}
		});
	});
}


private.loadMultisignatures = function (executor, cb) {
	modules.api.multisignatures.pending(executor.keypair.publicKey.toString("hex"), function (err, resp) {
		if (err) {
			return cb(err.toString());
		} else {
			var errs = [];
			var transactions = resp.transactions;

			async.eachSeries(transactions, function (item, cb) {
				if (item.transaction.type != 11) {
					return setImmediate(cb);
				}

				modules.api.multisignatures.sign(
					executor.secret,
					null,
					item.transaction.id,
					function (err) {
						if (err) {
							errs.push(err);
						}

						setImmediate(cb);
					}
				)
			}, function () {
				if (errs.length > 0) {
					return cb(errs[0]);
				}

				cb();
			});
		}
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

	setImmediate(function nextMultisigSync() {
		modules.blockchain.accounts.getExecutor(function (err, executor) {
			if (!err) {
				private.loadMultisignatures(executor, function (err) {
					err && library.logger('multisig timer', err);

					setTimeout(nextMultisigSync, 10 * 1000);
				});
			}
		});
	});
}

module.exports = Sync;