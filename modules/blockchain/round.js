var async = require('async');
var crypto = require('crypto-browserify');

var private = {}, self = null,
	library = null, modules = null;
private.delegates = [];
function Round(cb, _library) {
	self = this;
	library = _library;

	self.getDelegates(function (err, res) {
		private.delegates = res.multisignature || [];
		private.delegates.push(res.authorId);
		private.delegates.sort();
		cb(err, self);
	});
}

private.loop = function (point, cb) {
	var executor = modules.blockchain.accounts.getExecutor();
	if (!executor.address) {
		library.logger('loop', 'exit: secret doesn´t found');
		return cb();
	}

	library.sequence.add(function (cb) {
		var currentDelegate = private.getState(executor, point.height);

		if (currentDelegate) {
			modules.blockchain.blocks.createBlock(currentDelegate, point, cb);
		} else {
			cb();
		}

	}, function (err) {
		if (err) {
			library.logger("Problem in hash generation", err);
		}
		cb(err)
	})
}

private.getState = function (executor, height) {
	var delegates = self.generateDelegateList(height);

	var currentSlot = height;
	var lastSlot = currentSlot + delegates.length;

	for (; currentSlot < lastSlot; currentSlot += 1) {
		var delegate_pos = currentSlot % delegates.length;

		var delegate_id = delegates[delegate_pos];

		if (delegate_id && executor.address == delegate_id) {
			return executor;
		}
	}
	return null;
}

Round.prototype.getDelegates = function (cb) {
	var message = {
		call: "dapps#getDelegates",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
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

Round.prototype.onMessage = function (query) {
	if (query.topic == "point") {
		var blockId = query.message;
		private.loop(blockId, function (err) {
			console.log("loop", err)

		});
	}
}

module.exports = Round;