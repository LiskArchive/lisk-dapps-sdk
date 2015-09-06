var crypto = require('crypto-browserify');
var path = require('path');
var async = require('async');
var util = require('util');
var extend = require('extend');

var private = {}, self = null,
	library = null, modules = null;
private.lastBlock = null;
private.genesisBlock = null;
private.loaded = false;

function Blocks(cb, _library) {
	self = this;
	library = _library;

	try {
		private.genesisBlock = require(path.join(__dirname, "../../genesis.json"));
	} catch (e) {
		library.logger("failed genesis file");
	}

	private.lastBlock = private.genesisBlock;

	cb(null, self);
}

private.readDbRows = function (rows) {
	var blocks = {};
	var order = [];
	for (var i = 0, length = rows.length; i < length; i++) {
		var __block = modules.logic.block.dbRead(rows[i]);
		if (__block) {
			if (!blocks[__block.id]) {
				order.push(__block.id);
				blocks[__block.id] = __block;
			}

			var __transaction = modules.logic.transaction.dbRead(rows[i]);
			blocks[__block.id].transactions = blocks[__block.id].transactions || {};
			if (__transaction) {
				if (!blocks[__block.id].transactions[__transaction.id]) {
					blocks[__block.id].transactions[__transaction.id] = __transaction;
				}
			}
		}
	}

	blocks = order.map(function (v) {
		blocks[v].transactions = Object.keys(blocks[v].transactions).map(function (t) {
			return blocks[v].transactions[t];
		});
		return blocks[v];
	});

	return blocks;
}

private.saveBlock = function (block, cb, scope) {
	if (scope) {
		return setImmediate(cb)
	}
	modules.logic.block.save(block, function (err) {
		async.eachSeries(block.transactions, function (trs, cb) {
			modules.logic.transaction.save(trs, cb);
		}, cb);
	});
}

private.deleteBlock = function (blockId, cb) {
	modules.api.sql.remove({
		table: 'blocks',
		condition: {
			id: blockId
		}
	}, cb);
}

private.popLastBlock = function (oldLastBlock, cb) {
	self.getBlock({id: oldLastBlock.previousBlock}, function (err, previousBlock) {
		if (err || !previousBlock) {
			return cb(err || 'previousBlock is null');
		}

		async.eachSeries(oldLastBlock.transactions.reverse(), function (transaction, cb) {
			async.series([
				function (cb) {
					modules.transactions.undo(transaction, cb);
				}, function (cb) {
					modules.transactions.undoUnconfirmed(transaction, cb);
				}, function (cb) {
					modules.transactions.pushHiddenTransaction(transaction);
					setImmediate(cb);
				}
			], cb);
		}, function (err) {
			private.deleteBlock(oldLastBlock.id, function (err) {
				if (err) {
					return cb(err);
				}

				cb(null, previousBlock);
			});
		});
	});
}

private.verify = function (block, cb, scope) {
	if ((scope || private).lastBlock.id == (scope || private).genesisBlock.id) {
		try {
			var valid = modules.logic.block.verifySignature(block);
		} catch (e) {
			return cb(e.toString());
		}
		if (!valid) {
			return cb("wrong block");
		}
		return cb();
	} else {
		if ((scope || private).lastBlock.id != block.prevBlockId) {
			return cb("wrong prev block");
		}
	}
	modules.api.sql.select({
		table: "blocks",
		condition: {
			id: block.pointId
		},
		fields: ["id"]
	}, function (err, found) {
		if (err || found.length) {
			return cb("wrong block");
		}
		try {
			var valid = modules.logic.block.verifySignature(block);
		} catch (e) {
			return cb(e.toString());
		}
		if (!valid) {
			return cb("wrong block");
		}
		return cb();
	});
}

private.getIdSequence = function (height, cb) {
	modules.api.sql.select({
		query: {
			type: 'union',
			unionqueries: [{
				table: 'blocks',
				fields: [{id: "id"}, {expression: "max(height)", alias: "height"}],
				group: {
					expression: "(cast(height / 101 as integer) + (case when height % 101 > 0 then 1 else 0 end))",
					having: {
						height: {$lte: height}
					}
				}
			}, {
				table: 'blocks',
				condition: {
					height: 1
				},
				fields: [{id: "id"}, {expression: "1", alias: "height"}],
				sort: {
					height: -1
				}
			}],
			limit: 1000
		},
		alias: "s",
		fields: [{height: "height"}, {expression: "group_concat(s.id)", alias: "ids"}]
	}, {height: Number, ids: Array}, function (err, rows) {
		if (err || !rows.length) {
			return (err || "wrong ids request")
		}
		cb(null, rows[0]);
	});
}

Blocks.prototype.deleteBlocksBefore = function (block, cb) {
	async.whilst(
		function () {
			return !(block.height >= private.lastBlock.height)
		},
		function (next) {
			private.popLastBlock(private.lastBlock, function (err, newLastBlock) {
				private.lastBlock = newLastBlock;
				next(err);
			});
		},
		function (err) {
			setImmediate(cb, err);
		}
	);
}

Blocks.prototype.saveBlocks = function (blocks, cb) {
	async.eachSeries(blocks, function(block, cb){
		private.saveBlock(block, cb);
	}, cb);
}

Blocks.prototype.genesisBlock = function () {
	return private.genesisBlock;
}

Blocks.prototype.processBlock = function (block, cb, scope) {
	private.verify(block, function (err) {
		if (err) {
			console.log('here!');
			return cb(err);
		}

		modules.blockchain.transactions.undoUnconfirmedTransactionList(function (err, unconfirmedTransactions) {
			if (err) {
				return cb(err);
			}

			function done(err) {
				if (!err) {
					(scope || private).lastBlock = block;
					!scope && modules.api.transport.message("block", block, function () {

					});
				}
				modules.blockchain.transactions.applyUnconfirmedTransactionList(unconfirmedTransactions, function () {
					setImmediate(cb, err);
				}, scope);
			}

			var payloadHash = crypto.createHash('sha256'), appliedTransactions = {};

			async.eachSeries(block.transactions, function (transaction, cb) {
				transaction.blockId = block.id;

				if (appliedTransactions[transaction.id]) {
					return setImmediate(cb, "Dublicated transaction in block: " + transaction.id);
				}

				modules.blockchain.transactions.applyUnconfirmedTransaction(transaction, function (err) {
					if (err) {
						return setImmediate(cb, "Can't apply transaction: " + transaction.id);
					}

					try {
						var bytes = modules.logic.transaction.getBytes(transaction);
					} catch (e) {
						return setImmediate(cb, e.toString());
					}

					appliedTransactions[transaction.id] = transaction;

					var index = unconfirmedTransactions.indexOf(transaction.id);
					if (index >= 0) {
						unconfirmedTransactions.splice(index, 1);
					}

					payloadHash.update(bytes);

					setImmediate(cb);
				}, scope);
			}, function (err) {
				if (err) {
					async.eachSeries(block.transactions, function (transaction, cb) {
						if (appliedTransactions[transaction.id]) {
							modules.blockchain.transactions.undoUnconfirmedTransaction(transaction, cb, scope);
						} else {
							setImmediate(cb);
						}
					}, function () {
						done(err);
					});
				} else {
					async.eachSeries(block.transactions, function (transaction, cb) {
						modules.blockchain.transactions.applyTransaction(transaction, function (err) {
							if (err) {
								library.logger("Can't apply transactions: " + transaction.id);
							}
							modules.blockchain.transactions.removeUnconfirmedTransaction(transaction.id, scope);
							setImmediate(cb);
						}, scope);
					}, function (err) {
						private.saveBlock(block, done, scope);
					});
				}
			});
		}, scope);
	});
}

Blocks.prototype.createBlock = function (executor, point, cb, scope) {
	modules.blockchain.transactions.getUnconfirmedTransactionList(false, function (err, unconfirmedList) {
		var ready = [];

		async.eachSeries(unconfirmedList, function (transaction, cb) {
			modules.blockchain.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
				if (err) {
					return cb("sender doesn´t found");
				}

				modules.logic.transaction.verify(transaction, sender, function (err) {
					ready.push(transaction);
					cb();
				});
			}, scope);
		}, function () {
			var blockObj = {
				delegate: executor.keypair.publicKey,
				height: private.lastBlock.height + 1,
				prevBlockId: private.lastBlock.id,
				pointId: point.id,
				pointHeight: point.height,
				count: ready.length,
				transactions: ready
			};

			var blockBytes = modules.logic.block.getBytes(blockObj);

			blockObj.id = modules.api.crypto.getId(blockBytes);
			blockObj.signature = modules.api.crypto.sign(executor.keypair, blockBytes);

			self.processBlock(blockObj, cb);
		});
	}, scope);
}

Blocks.prototype.applyBlocks = function (blocks, cb, scope) {
	async.eachSeries(blocks, function (block, cb) {
		try {
			var valid = modules.logic.block.verifySignature(block);
		} catch (e) {
			return setImmediate(cb, {
				message: e.toString(),
				block: block
			});
		}
		if (!valid) {
			return setImmediate(cb, {
				message: "Can't verify block signature",
				block: block
			});
		}
		(scope || private).lastBlock = block;
		async.eachSeries(block.transactions, function (transaction, cb) {
			modules.blockchain.accounts.setAccountAndGet({publicKey: transaction.senderPublicKey}, function (err, sender) {
				if (err) {
					return cb({
						message: err,
						transaction: transaction,
						block: block
					});
				}
				modules.logic.transaction.verify(transaction, sender, function (err) {
					if (err) {
						return setImmediate(cb, {
							message: err,
							transaction: transaction,
							block: block
						});
					}

					async.series([
						function (cb) {
							modules.blockchain.transactions.applyUnconfirmedTransaction(transaction, cb, scope);
						},
						function (cb) {
							modules.blockchain.transactions.applyTransaction(transaction, cb, scope);
						}
					], cb)
				});
			}, scope);
		}, cb);
	}, function (err) {
		cb(err, blocks);
	});
}

Blocks.prototype.loadBlocksPeer = function (peer, cb, scope) {
	modules.api.transport.getPeer(peer, "get", "/blocks/after", {lastBlockHeight: scope.lastBlock.height}, function (err, res) {
		console.log("loading after", scope.lastBlock.height)
		if (err || !res.body.success) {
			return cb(err);
		}

		var blocks = private.readDbRows(res.body.response);

		console.log(blocks.map(function (el) {
			return el.height
		}));

		self.applyBlocks(blocks, cb, scope);
	});
}

Blocks.prototype.loadBlocksOffset = function (limit, offset, cb) {
	self.getBlocks(function (err, blocks) {
		if (err) {
			return cb(err);
		}

		blocks = private.readDbRows(blocks);

		self.applyBlocks(blocks, cb);
	}, {limit: limit, offset: offset})
}

Blocks.prototype.findCommon = function (cb, query) {
	modules.api.sql.select({
		table: "blocks",
		condition: {
			id: {
				$in: query.ids
			},
			height: {$between: [query.min, query.max]}
		},
		fields: [{expression: "max(height)", alias: "height"}, "id", "prevBlockId"]
	}, {"height": Number, "id": String, "prevBlockId": String}, function (err, rows) {
		if (err) {
			return cb(err);
		}

		var commonBlock = rows.length ? rows[0] : null;
		cb(null, commonBlock);
	});
}

Blocks.prototype.getCommonBlock = function (height, peer, cb) {
	var commonBlock = null;
	var lastBlockHeight = height;
	var count = 0;

	async.whilst(
		function () {
			return !commonBlock && count < 30 && lastBlockHeight > 1;
		},
		function (next) {
			count++;
			private.getIdSequence(lastBlockHeight, function (err, data) {
				if (err) {
					return next(err);
				}
				var max = lastBlockHeight;
				lastBlockHeight = data.height;
				modules.api.transport.getPeer(peer, "get", "/blocks/common", {
					ids: data.ids,
					max: max,
					min: lastBlockHeight
				}, function (err, data) {
					if (err || !data.body.success) {
						return next(err);
					}

					if (!data.body.response) {
						return next();
					}

					modules.api.sql.select({
						table: "blocks",
						condition: {
							id: data.body.response.id,
							height: data.body.response.height,
							previousBlock: data.body.response.previousBlock
						},
						fields: [{expression: "count(id)", alias: "cnt"}]
					}, {"cnt": Number}, function (err, rows) {
						if (err || !rows.length) {
							return next(err || "Can't compare blocks");
						}

						if (rows[0].cnt) {
							commonBlock = data.body.response;
						}
						next();
					});
				});
			});
		},
		function (err) {
			setImmediate(cb, err, commonBlock);
		}
	)
}

Blocks.prototype.count = function (cb) {
	modules.api.sql.select({
		table: "blocks",
		fields: [{
			expression: 'count(*)'
		}]
	}, function (err, rows) {
		var count = !err && Number(rows[0][0]);
		cb(err, count);
	});
}

Blocks.prototype.getHeight = function (cb) {
	cb(null, private.lastBlock.height);
}

Blocks.prototype.getLastBlock = function (cb) {
	cb(null, private.lastBlock);
}

Blocks.prototype.getBlock = function (cb, query) {
	modules.api.sql.select(extend(library.scheme.selector["blocks"], {
		condition: query,
		fields: library.scheme.fields
	}), library.scheme.alias, function (err, rows) {
		console.log(err, rows)
		if (err) {
			return cb(err);
		}
		cb(null, rows[0]);
	});
}

Blocks.prototype.getBlocks = function (cb, query) {
	modules.api.sql.select(extend(library.scheme.selector["blocks"], {
		limit: !query.limit || query.limit > 100 ? 100 : query.limit,
		offset: !query.offset || query.offset < 0 ? 0 : query.offset,
		fields: library.scheme.fields
	}), library.scheme.alias, cb);
}

Blocks.prototype.getBlocksAfter = function (cb, query) {
	modules.api.sql.select(extend(library.scheme.selector["blocks"], {
		limit: 100,
		condition: {
			"b.height": {$gt: query.lastBlockHeight}
		},
		fields: library.scheme.fields
	}), library.scheme.alias, cb);
}

Blocks.prototype.onMessage = function (query) {
	if (query.topic == "block" && private.loaded) {
		var block = query.message;
		if (block.lastBlockId == private.lastBlock.id && block.id != private.lastBlock.id && block.id != private.genesisBlock.id) {
			self.processBlock(block, function (err) {
				if (err) {
					library.logger("processBlock err", err);
				}
			});
		}
	}
}

Blocks.prototype.onBlockchainLoaded = function () {
	private.loaded = true;
}

Blocks.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.api.sql.select({
		table: "blocks",
		condition: {
			id: private.genesisBlock.id
		},
		fields: ["id"]
	}, function (err, found) {
		if (err) {
			library.logger("genesis error 1", err)
		}
		if (!found.length) {
			self.processBlock(private.genesisBlock, function (err) {
				if (!err) {
					library.bus.message("blockchainReady");
				} else {
					library.logger("genesis error 2", err)
				}
			})
		} else {
			library.bus.message("blockchainReady");
		}
	});
}

module.exports = Blocks;