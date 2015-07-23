var async = require('async');

var self = null;
var private = {};
private.library = null;
private.modules = null;
private.delegates = [];

function Round(cb, library) {
	self = this;

	private.library = library;

	this.getDelegates(function (err, res) {
		private.delegates = res.multisignature || [];
		private.delegates.push(res.authorId);
		private.delegates.sort();
		cb(err, self);
	});
}

private.getSequence = function (slot, height, cb) {
	self.generateDelegateList(height, function (err, delegates) {
		var currentSlot = slot;
		var lastSlot = currentSlot + delegates.length;

		for (; currentSlot < lastSlot; currentSlot += 1) {
			var delegate_pos = currentSlot % delegates.length;

			var delegate_id = delegates[delegate_pos];

			if (delegate_id && private.library.env.address == delegate_id) {
				return cb(null, private.library.env);
			}
		}
		return cb(null, null);
	});
}

Round.prototype.getDelegates = function (cb) {
	var message = {
		call: "dapp#getDelegates",
		args: {}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Round.prototype.calc = function (height) {
	return Math.floor(height / private.delegates.length) + (height % private.delegates.length > 0 ? 1 : 0);
}

Round.prototype.generateDelegateList = function (height, cb) {
	var seedSource = self.calc(height).toString();

	var delegates = private.delegates.slice(0);

	private.modules.crypto.sha256(seedSource, function (err, currentSeed) {
		var i = 0, x = 0;
		async.whilst(function () {
			return i < delegates.length;
		}, function (i_cd) {
			i++;
			async.whilst(function () {
				return x < 4 && i < delegates.length;
			}, function (x_cb) {
				i++;
				x++;
				var newIndex = currentSeed[x] % delCount;
				var b = delegates[newIndex];
				delegates[newIndex] = delegates[i];
				delegates[i] = b;
				setImmediate(x_cb);
			}, function (err) {
				private.modules.crypto.sha256(seedSource, function (err, _currentSeed) {
					currentSeed = _currentSeed;
					i_cd(err);
				});
			})
		}, function (err) {
			cb(err, delegates);
		});
	});
}

Round.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Round;