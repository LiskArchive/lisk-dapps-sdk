var crypto = require('crypto-browserify');
var path = require('path');
var async = require('async');
var util = require('util');
var extend = require('extend');
var timeHelper = require('../helpers/time.js');

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

private.deleteBlock = function (blockId, cb) {
	modules.api.sql.remove({
		table: 'blocks',
		condition: {
			id: blockId
		}
	}, cb);
}

private.popLastBlock = function (oldLastBlock, cb) {
	if (!oldLastBlock.prevBlockId) {
		return cb("Can´t remove genesis block");
	}
	self.getBlock(function (err, previousBlock) {
		if (err || !previousBlock) {
			return cb(err || 'previousBlock is null');
		}

		previousBlock = self.readDbRows(previousBlock);

		var fee = 0;
		async.eachSeries(oldLastBlock.transactions.reverse(), function (transaction, cb) {
			async.series([
				function (cb) {
					fee += transaction.fee;
					modules.blockchain.transactions.undo(transaction, cb);
				}, function (cb) {
					modules.blockchain.transactions.undoUnconfirmed(transaction, cb);
				}
			], cb);
		}, function (err) {
			if (err) {
				library.logger(err);
				process.exit(0);
			}

			modules.blockchain.accounts.undoMerging({
				publicKey: oldLastBlock.delegate,
				balance: fee
			}, function (err) {
				private.deleteBlock(oldLastBlock.id, function (err) {
					if (err) {
						return cb(err);
					}

					cb(null, previousBlock[0]);
				});
			});
		});
	}, {id: oldLastBlock.prevBlockId});
}

private.verify = function (block, cb, scope) {
	if (block.id == private.genesisBlock.id) {
		try {
			var valid = modules.logic.block.verifySignature(block);
		} catch (e) {
			return cb(e.toString());
		}
		if (!valid) {
			//skip now for genesis, because i don't know how to generate (pending paul)
			//return cb("wrong block");
		}
		return cb();
	} else {
		if (block.delegates) {
			return cb("wrong delegates in block");
		}

		if (block.prevBlockId != (scope || private).lastBlock.id) {
			return cb("wrong prev block");
		}

		if (block.pointHeight < (scope || private).lastBlock.pointHeight) {
			return cb("wrong point height")
		}
	}

	if (block.timestamp <= (scope || private).lastBlock.timestamp || block.timestamp > timeHelper.getNow()) {
		return cb("wrong timestamp");
	}

	if (block.payloadLength > 1024 * 1024) {
		return cb("wrong payload length");
	}

	try {
		var hash = new Buffer(block.payloadHash, 'hex');
		if (hash.length != 32) {
			return cb("wrong payload hash");
		}
	} catch (e) {
		return cb("wrong payload hash");
	}

	modules.api.blocks.getBlock(block.pointId, function (err, cryptiBlock) {
		if (err || !cryptiBlock) {
			return cb(err || "block doesn´t exist in crypti");
		}

		modules.api.sql.select({
			table: "blocks",
			condition: {
				id: block.pointId
			},
			fields: ["id"]
		}, function (err, found) {
			if (err || found.length) {
				return cb("block exists in dapp");
			}

			try {
				var valid = modules.logic.block.verifySignature(block);
			} catch (e) {
				return cb(e.toString());
			}

			if (!valid) {
				return cb("can´t verify block signature");
			}

			return cb();
		});
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
				fields: [{id: "id"}, {expression: "1", alias: "height"}]
			}],
			sort: {
				height: 1
			},
			limit: 1000
		},
		alias: "s",
		fields: [{height: "height"}, {expression: "group_concat(s.id)", alias: "ids"}]
	}, {height: Number, ids: Array}, function (err, rows) {
		if (err || !rows.length) {
			return cb(err || "wrong ids request")
		}
		cb(null, rows[0]);
	});
}

private.rollbackUntilBlock = function (block, cb) {
	modules.api.sql.select({
		table: "blocks",
		condition: {
			pointId: block.pointId,
			pointHeight: block.pointHeight
		},
		fields: ["id", "height"]
	}, {"id": String, "height": Number}, function (err, found) {
		if (!err && found.length) {
			console.log("rollbackUntilBlock", found)
			self.deleteBlocksBefore(found[0], cb);
		} else {
			cb();
		}
	});
}

private.processBlock = function (block, cb, scope) {
	try {
		var blockBytes = modules.logic.block.getBytes(block);
		block.id = modules.api.crypto.getId(blockBytes);
	} catch (e) {
		return cb(e.toString())
	}

	modules.logic.block.normalize(block, function (err) {
		if (err) {
			return cb(err);
		}

		private.verify(block, function (err) {
			if (err) {
				return cb(err);
			}

			self.applyBlock(block, function (err) {
				if (err) {
					return cb(err);
				}
				!scope && modules.api.transport.message("block", block, function () {

				});

				self.saveBlock(block, function (err) {
					if (err) {
						library.logger(err.toString());
						process.exit(0);
					}
					cb();
				}, scope);

			}, scope);
		}, scope);
	});
}

Blocks.prototype.applyBatchBlock = function (blocks, cb) {
	async.eachSeries(blocks, function (block, cb) {
		modules.blockchain.blocks.applyBlock(block, cb);
	}, cb);
}

Blocks.prototype.saveBatchBlock = function (blocks, cb) {
	var blocks_row = [];
	var transactions_row = [];
	for (var i = 0; i < blocks.length; i++) {
		blocks_row.push([
			blocks[i].id,
			blocks[i].timestamp,
			blocks[i].height,
			blocks[i].payloadLength,
			blocks[i].payloadHash,
			blocks[i].prevBlockId,
			blocks[i].pointId,
			blocks[i].pointHeight,
			blocks[i].delegate,
			blocks[i].signature,
			blocks[i].count
		]);
		for (var n = 0; n < blocks[i].transactions.length; n++) {
			transactions_row.push([
				blocks[i].transactions[n].id,
				blocks[i].transactions[n].type,
				blocks[i].transactions[n].senderId,
				blocks[i].transactions[n].senderPublicKey,
				blocks[i].transactions[n].recipientId,
				blocks[i].transactions[n].amount,
				blocks[i].transactions[n].fee,
				blocks[i].transactions[n].timestamp,
				blocks[i].transactions[n].signature,
				blocks[i].transactions[n].blockId
			]);
		}
	}
	modules.api.sql.batch({
		table: "blocks",
		fields: ["id", "timestamp", "height", "payloadLength", "payloadHash", "prevBlockId", "pointId", "pointHeight", "delegate",
			"signature", "count"],
		values: blocks_row
	}, function (err) {
		if (err) {
			return cb(err);
		}
		modules.api.sql.batch({
			table: "transactions",
			fields: ["id", "type", "senderId", "senderPublicKey", "recipientId", "amount", "fee", "timestamp",
				"signature", "blockId"],
			values: transactions_row
		}, cb);
	});
}

Blocks.prototype.saveBlock = function (block, cb, scope) {
	if (scope) {
		return setImmediate(cb)
	}
	modules.logic.block.save(block, function (err) {
		if (err) {
			return cb(err);
		}
		async.eachSeries(block.transactions, function (trs, cb) {
			trs.blockId = block.id;
			modules.logic.transaction.save(trs, cb);
		}, cb);
	});
}

Blocks.prototype.readDbRows = function (rows) {
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

Blocks.prototype.deleteBlocksBefore = function (block, cb) {
	async.whilst(
		function () {
			return !(block.height >= private.lastBlock.height)
		},
		function (next) {
			console.log("popLastBlock", private.lastBlock.height)
			private.popLastBlock(private.lastBlock, function (err, newLastBlock) {
				if (!err) {
					private.lastBlock = newLastBlock;
				}
				next(err);
			});
		},
		function (err) {
			setImmediate(cb, err);
		}
	);
}

Blocks.prototype.simpleDeleteAfterBlock = function (height, cb) {
	modules.api.sql.remove({
		table: 'blocks',
		condition: {
			height: {$gte: height}
		}
	}, cb);
}

Blocks.prototype.genesisBlock = function () {
	return private.genesisBlock;
}

Blocks.prototype.createBlock = function (executor, timestamp, point, cb, scope) {
	modules.blockchain.transactions.getUnconfirmedTransactionList(false, function (err, unconfirmedList) {
		var ready = [];

		var payloadHash = crypto.createHash('sha256'),
			payloadLength = 0;

		console.log("found", unconfirmedList.length)
		async.eachSeries(unconfirmedList, function (transaction, cb) {
			modules.blockchain.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
				if (err) {
					return cb("sender doesn´t found");
				}
				async.series([
					function (cb) {
						modules.logic.transaction.verify(transaction, sender, cb, scope);
					},
					function (cb) {
						modules.logic.transaction.ready(transaction, sender, cb, scope);
					},
					function (cb) {
						var bytes = modules.logic.transaction.getBytes(transaction);

						if ((payloadLength + bytes.length) > 1024 * 1024) {
							return setImmediate(cb);
						}

						payloadHash.update(bytes);
						payloadLength += bytes.length;

						ready.push(transaction);
						cb();
					},
				], function (err) {
					if (err) {
						library.logger(err);
					}

					cb();
				})
			}, scope);
		}, function () {
			var blockObj = {
				delegate: executor.keypair.publicKey.toString("hex"),
				height: private.lastBlock.height + 1,
				prevBlockId: private.lastBlock.id,
				pointId: point.id,
				timestamp: timestamp,
				pointHeight: point.height,
				count: ready.length,
				transactions: ready,
				payloadHash: payloadHash.digest().toString('hex'),
				payloadLength: payloadLength
			};

			var ids = ready.map(function (item) {
				return item.id;
			});

			var blockBytes = modules.logic.block.getBytes(blockObj);

			blockObj.id = modules.api.crypto.getId(blockBytes);
			blockObj.signature = modules.api.crypto.sign(executor.keypair, blockBytes);

			// unconfirmed transactions
			var unconfirmedTransactionsList = modules.blockchain.transactions.getUnconfirmedTransactionList(true, function (err, list) {
				async.eachSeries(list, function (transaction, cb) {
					modules.blockchain.transactions.undoUnconfirmedTransaction(transaction, cb);
				}, function (err) {
					if (err) {
						library.logger("Can't undo transactions before process block: " + err.toString());
						cb(err);
					} else {
						private.processBlock(blockObj, function (err) {
							if (err) {
								library.logger("Block generation error", err);
							}

							async.eachSeries(list, function (transaction, cb) {
								if (err) {
									modules.blockchain.transactions.applyUnconfirmedTransaction(transaction, function (err) {
										cb();
									});
								} else {
									if (ids.indexOf(transaction.id) < 0) {
										modules.blockchain.transactions.applyUnconfirmedTransaction(transaction, function (err) {
											cb();
										});
									} else {
										setImmediate(cb);
									}
								}
							}, cb);
						});
					}
				});
			});
		});
	}, scope);
}

Blocks.prototype.applyBlock = function (block, cb, scope) {
	var payloadHash = crypto.createHash('sha256'),
		appliedTransactions = {},
		fee = 0,
		payloadLength = 0;

	async.eachSeries(block.transactions, function (transaction, cb) {
		modules.logic.transaction.normalize(transaction, function (err) {
			if (err) {
				return cb(err);
			}

			var trsBytes = modules.logic.transaction.getBytes(transaction);
			transaction.id = modules.api.crypto.getId(trsBytes);
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

				payloadHash.update(bytes);
				payloadLength += bytes.length;
				appliedTransactions[transaction.id] = transaction;
				fee += transaction.fee;

				modules.blockchain.transactions.removeUnconfirmedTransaction(transaction.id, cb, scope);
			}, scope);
		});
	}, function (err) {
		if (err) {
			return cb(err);
		}

		payloadHash = payloadHash.digest();

		if (payloadLength != block.payloadLength) {
			err = "wrong payload length";
		}

		if (payloadHash.toString('hex') != block.payloadHash) {
			err = "wrong payload hash";
		}

		if (err) {
			async.eachSeries(block.transactions, function (transaction, cb) {
				if (appliedTransactions[transaction.id]) {
					modules.blockchain.transactions.undoUnconfirmedTransaction(transaction, cb, scope);
				} else {
					setImmediate(cb);
				}
			}, function (undoErr) {
				if (undoErr) {
					library.logger(undoErr.toString());
					process.exit(0);
				}
				cb(err);
			});
		} else {
			appliedTransactions = {};
			async.eachSeries(block.transactions, function (transaction, cb) {
				modules.blockchain.transactions.applyTransaction(transaction, function (err) {
					if (err) {
						library.logger("Can't apply transactions: " + transaction.id);
						return setImmediate(cb, err);
					}

					modules.blockchain.transactions.removeUnconfirmedTransaction(transaction.id, function () {
						appliedTransactions[transaction.id] = true;
						setImmediate(cb);
					}, scope);
				}, scope);
			}, function (err) {
				if (err) {
					async.eachSeries(block.transactions, function (transaction, cb) {
						if (appliedTransactions[transaction.id]) {
							modules.blockchain.transactions.undoTransaction(transaction, function (err) {
								if (err) {
									library.logger(err.toString());
									process.exit(0);
								} else {
									modules.blockchain.transactions.undoUnconfirmedTransaction(transaction, cb, scope);
								}
							}, scope);
						} else {
							modules.blockchain.transactions.undoUnconfirmedTransaction(transaction, cb, scope);
						}
					}, function (undoErr) {
						if (undoErr) {
							library.logger(undoErr.toString());
							process.exit(0);
						} else {
							cb(err);
						}
					});
				} else {
					// merge account and add fees
					modules.blockchain.accounts.mergeAccountAndGet({
						publicKey: block.delegate,
						balance: fee,
						u_balance: fee
					}, function (err) {
						if (!err) {
							(scope || private).lastBlock = block;
						}
						cb(err);
					}, scope);
				}
			});
		}
	});
}

Blocks.prototype.loadBlocksPeer = function (peer, cb, scope) {
	console.log("load blocks after", scope.lastBlock.height)
	modules.api.transport.getPeer(peer, "get", "/blocks/after", {lastBlockHeight: scope.lastBlock.height}, function (err, res) {
		if (err || !res.body || !res.body.success) {
			return cb(err);
		}

		var blocks = self.readDbRows(res.body.response);

		async.eachSeries(blocks, function (block, cb) {
			private.processBlock(block, cb, scope);
		}, function (err) {
			cb(err, blocks)
		});
	});
}

Blocks.prototype.loadBlocksOffset = function (limit, offset, cb) {
	self.getBlocks(function (err, blocks) {
		if (err) {
			return cb(err);
		}

		blocks = self.readDbRows(blocks);

		async.eachSeries(blocks, function (block, cb) {
			//private.verify(block, function (err) {
			//	if (err) {
			//		return cb({message: err, block: block});
			//	}
			self.applyBlock(block, function (err) {
				if (err) {
					return cb({block: block, message: err})
				}
				cb();
			});
			//});
		}, cb);
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
		sort: {
			height: 1
		},
		fields: [{expression: "max(height)", alias: "height"}, "id", "prevBlockId"]
	}, {"height": Number, "id": String, "prevBlockId": String}, function (err, rows) {
		if (err) {
			return cb(err);
		}

		var commonBlock = rows.length && rows[0].height ? rows[0] : null;
		cb(commonBlock ? null : "No common block", commonBlock);
	});
}

Blocks.prototype.getCommonBlock = function (height, peer, cb) {
	var commonBlock = null;
	var lastBlockHeight = height;
	var count = 0;

	async.whilst(
		function () {
			return !commonBlock && count < 30;
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
					if (err || !data.body || !data.body.success) {
						return next(err || "Can't find common blocks");
					}

					if (!data.body.response) {
						return next("Can't find common blocks");
					}

					var condition = {
						id: data.body.response.id,
						height: data.body.response.height
					};
					if (data.body.response.prevBlockId) {
						condition.prevBlockId = data.body.response.prevBlockId
					}
					modules.api.sql.select({
						table: "blocks",
						condition: condition,
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
	}, {count: Number}, function (err, rows) {
		if (err){
			return cb(err);
		}
		cb(err, rows[0].count);
	});
}

Blocks.prototype.getHeight = function (cb) {
	cb(null, private.lastBlock.height);
}

Blocks.prototype.getLastBlock = function () {
	return private.lastBlock;
}

Blocks.prototype.getBlock = function (cb, query) {
	modules.api.sql.select(extend({}, library.scheme.selector["blocks"], {
		condition: {"b.id": query.id},
		fields: library.scheme.fields
	}), library.scheme.alias, cb);
}

Blocks.prototype.getBlocks = function (cb, query) {
	modules.api.sql.select(extend({}, library.scheme.selector["blocks"], {
		limit: !query.limit || query.limit > 1000 ? 1000 : query.limit,
		offset: !query.offset || query.offset < 0 ? 0 : query.offset,
		fields: library.scheme.fields,
		sort: {
			height: 1
		}
	}), library.scheme.alias, cb);
}

Blocks.prototype.getBlocksAfter = function (cb, query) {
	modules.api.sql.select(extend({}, library.scheme.selector["blocks"], {
		limit: 1000,
		condition: {
			"b.height": {$gt: query.lastBlockHeight}
		},
		fields: library.scheme.fields,
		sort: {
			height: 1
		}
	}), library.scheme.alias, cb);
}

Blocks.prototype.onMessage = function (query) {
	if (query.topic == "block" && private.loaded) {
		library.sequence.add(function (cb) {
			var block = query.message;
			//console.log("check", block.prevBlockId + " == " + private.lastBlock.id, block.id + " != " + private.lastBlock.id)
			if (block.prevBlockId == private.lastBlock.id && block.id != private.lastBlock.id && block.id != private.genesisBlock.id) {
				private.processBlock(block, function (err) {
					if (err) {
						library.logger("processBlock err", err);
					}
					cb(err);
				})
			} else {
				cb();
			}
		});
	}

	if (query.topic == "rollback" && private.loaded) {
		library.sequence.add(function (cb) {
			var block = query.message;
			console.log("rollback", block)
			if (block.pointHeight <= private.lastBlock.pointHeight) {
				private.rollbackUntilBlock(block, function (err) {
					if (err) {
						library.logger("rollbackUntilBlock err", err);
					}
					cb(err);
				});
			} else {
				cb();
			}
		});

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
			library.logger("genesis error", err)
			process.exit(0);
		}
		if (!found.length) {
			self.saveBlock(private.genesisBlock, function (err) {
				if (err) {
					library.logger("genesis error", err.toString());
					process.exit(0);
				} else {
					library.bus.message("blockchainReady");
				}
			});
		} else {
			library.bus.message("blockchainReady");
		}
	});
}

module.exports = Blocks;