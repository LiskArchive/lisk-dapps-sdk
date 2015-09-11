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

			modules.accounts.undoMerging({
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
			return cb("wrong block");
		}
		return cb();
	} else {
		if (block.prevBlockId != (scope || private).lastBlock.id) {
			return cb("wrong prev block");
		}

		if (block.pointHeight < (scope || private).lastBlock.pointHeight) {
			return cb("wrong point height")
		}
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

private.rollbackUntilBlock = function (block, cb) {
	modules.api.sql.select({
		table: "blocks",
		condition: {
			pointId: block.pointId,
			pointHeight: block.pointHeight
		},
		fields: ["id", "height"]
	}, function (err, found) {
		if (!err && found.length) {
			self.deleteBlocksBefore(found, cb);
		} else {
			cb();
		}
	});
}

private.processBlock = function (block, cb, scope) {
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
				} else {
					var errs = [];
					async.eachSeries(block.transactions, function (transaction, cb) {
						if (transaction.type == 2) {
							var executor = modules.blockchain.accounts.getExecutor();

							if (executor || executor.secret) {
								var address = modules.blockchain.accounts.generateAddressByPublicKey(transaction.senderPublicKey);

								modules.api.transactions.addTransactions(
									executor.secret,
									trs.amount,
									address,
									null,
									null,
									executor.keypair.publicKey
									, function (err) {
										if (err) {
											errs.push(err);
										}

										cb();
									});
							} else {
								return setImmediate(cb);
							}
						} else {
							return setImmediate(cb);
						}
					}, function () {
						if (errs.length > 0) {
							library.logger(err[0].toString());
						}

						cb();
					});
				}
			}, scope);
		}, scope);
	}, scope);
}

Blocks.prototype.saveBlock = function (block, cb, scope) {
	if (scope) {
		return setImmediate(cb)
	}
	modules.logic.block.save(block, function (err) {
		async.eachSeries(block.transactions, function (trs, cb) {
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

Blocks.prototype.genesisBlock = function () {
	return private.genesisBlock;
}

/*
Blocks.prototype.processBlock = function (block, cb, scope) {
	private.verify(block, function (err) {
		if (err) {
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


		}, scope);
	});
}
*/

Blocks.prototype.createBlock = function (executor, point, cb, scope) {
	modules.blockchain.transactions.getUnconfirmedTransactionList(false, function (err, unconfirmedList) {
		var ready = [];

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
						ready.push(transaction);
						cb();
					},
				], function (err) {
					cb();
				})
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

			private.processBlock(blockObj, cb);
		});
	}, scope);
}

Blocks.prototype.applyBlock = function (block, cb, scope) {
	var payloadHash = crypto.createHash('sha256'), appliedTransactions = {};
	var fee = 0;

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
			fee += transaction.fee;

			payloadHash.update(bytes);

			modules.blockchain.transactions.getUnconfirmedTransaction(transaction.id, function (err, transaction) {
				modules.blockchain.transactions.removeUnconfirmedTransaction(transaction.id, cb, scope);
			}, scope);
		}, scope);
	}, function (err) {
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
					}
					modules.blockchain.transactions.removeUnconfirmedTransaction(transaction.id, scope);
					appliedTransactions[transaction.id] = true;
					setImmediate(cb);
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
						balance: fee
					}, function (err) {
						(scope || private).lastBlock = block;
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
		if (err || !res.body.success) {
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
			self.applyBlock(block, cb);
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
					if (err || !data.body.success) {
						return next(err);
					}

					if (!data.body.response) {
						return next();
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
	}, function (err, rows) {
		var count = !err && Number(rows[0][0]);
		cb(err, count);
	});
}

Blocks.prototype.getHeight = function (cb) {
	cb(null, private.lastBlock.height);
}

Blocks.prototype.getLastBlock = function (cb) {
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
		limit: !query.limit || query.limit > 100 ? 100 : query.limit,
		offset: !query.offset || query.offset < 0 ? 0 : query.offset,
		fields: library.scheme.fields
	}), library.scheme.alias, cb);
}

Blocks.prototype.getBlocksAfter = function (cb, query) {
	modules.api.sql.select(extend({}, library.scheme.selector["blocks"], {
		limit: 50,
		condition: {
			"b.height": {$gt: query.lastBlockHeight}
		},
		fields: library.scheme.fields
	}), library.scheme.alias, cb);
}

Blocks.prototype.onMessage = function (query) {
	if (query.topic == "block" && private.loaded) {
		library.sequence.add(function (cb) {
			var block = query.message;
			console.log("check", block.prevBlockId + " == " + private.lastBlock.id, block.id + " != " + private.lastBlock.id)
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
			library.logger("genesis error 1", err)
		}
		if (!found.length) {
			private.processBlock(private.genesisBlock, function (err) {
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