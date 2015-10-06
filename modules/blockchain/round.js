var async = require('async');
var crypto = require('crypto-browserify');
var slots = require('../helpers/slots.js');

var private = {}, self = null,
	library = null, modules = null;
private.delegates = [];
private.loaded = false;

function Round(cb, _library) {
	self = this;
	library = _library;

	cb(null, self);
}

private.loop = function (point, cb) {
	modules.blockchain.accounts.getExecutor(function (err, executor) {
		if (err) {
			return cb();
		}

		if (!private.loaded) {
			library.logger('loop', 'exit: syncing');
			return setImmediate(cb);
		}

		var currentSlot = slots.getSlotNumber();
		var lastBlock = modules.blockchain.blocks.getLastBlock();

		if (currentSlot == slots.getSlotNumber(lastBlock.timestamp)) {
			//library.logger.log('loop', 'exit: lastBlock is in the same slot');
			return setImmediate(cb);
		}

		var currentBlockData = private.getState(executor, point.height);
		if (currentBlockData === null) {
			library.logger('loop', 'skip slot');
			return setImmediate(cb);
		}

		library.sequence.add(function (cb) {
			if (slots.getSlotNumber(currentBlockData) == slots.getSlotNumber()) {
				modules.blockchain.blocks.createBlock(executor, currentBlockData, point, cb);
			} else {
				setImmediate(cb);
			}
		}, function (err) {
			if (err) {
				library.logger("Problem in block generation", err);
			} else {
				var lastBlock = modules.blockchain.blocks.getLastBlock();
				library.logger("new dapp block id: " + lastBlock.id + " height: " + lastBlock.height + " via point: " + lastBlock.pointHeight);
			}
			cb(err);
		})
	});
}

private.getState = function (executor, height) {
	var delegates = self.generateDelegateList(height);

	var currentSlot = slots.getSlotNumber();
	var lastSlot = slots.getLastSlot(currentSlot);

	for (; currentSlot < lastSlot; currentSlot += 1) {
		var delegate_pos = currentSlot % delegates.length;

		var delegate_id = delegates[delegate_pos];

		if (delegate_id && executor.address == delegate_id) {
			return slots.getSlotTime(currentSlot);
		}
	}

	return null;
}

Round.prototype.calc = function (height) {
	return Math.floor(height / private.delegates.length) + (height % private.delegates.length > 0 ? 1 : 0);
}

Round.prototype.generateDelegateList = function (height) {
	var seedSource = self.calc(height).toString();

	var delegates = private.delegates.slice(0);

	var currentSeed = crypto.createHash('sha256').update(seedSource, 'utf8').digest();
	for (var i = 0, delCount = delegates.length; i < delCount; i++) {
		for (var x = 0; x < 4 && i < delCount; i++, x++) {
			var newIndex = currentSeed[x] % delCount;
			var b = delegates[newIndex];
			delegates[newIndex] = delegates[i];
			delegates[i] = b;
		}
		currentSeed = crypto.createHash('sha256').update(currentSeed).digest();
	}

	return delegates;
}

Round.prototype.onBind = function (_modules) {
	modules = _modules;
}

Round.prototype.onBlockchainLoaded = function () {
	private.loaded = true;
}

Round.prototype.onDelegates = function (delegates) {
	private.delegates = [];
	for (var i = 0; i < delegates.length; i++) {
		private.delegates.push(modules.blockchain.accounts.generateAddressByPublicKey(delegates[i]));
		private.delegates.sort();
	}
	slots.delegates = private.delegates.length;
}

Round.prototype.onMessage = function (query) {
	if (query.topic == "point" && private.loaded) {
		var block = query.message;
		private.loop(block, function (err) {
			if (err) {
				library.logger("loop error", err)
			}
		});
	}
}

module.exports = Round;